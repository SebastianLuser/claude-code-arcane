# MongoDB operations

Commands are for `mongosh`. On Atlas, start with the Performance Advisor, the Query Profiler and the Real-Time panel: they show the same data with history.

## Connections

```js
db.serverStatus().connections   // current, available, totalCreated
```

`totalCreated` growing fast with a flat `current` means the app opens a new client per request instead of reusing one: create the `MongoClient` once per process. Size `maxPoolSize` per instance so instances × pool stays under the cluster's connection limit.

## What is running and what is slow

```js
// Operations running longer than 5 seconds
db.currentOp({ active: true, secs_running: { $gte: 5 } })

// Turn on the profiler for slow operations (level 1), then read them
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ millis: -1 }).limit(10)

// Explain a suspect query: look for COLLSCAN and docsExamined >> nReturned
db.orders.find({ customerId: 42 }).explain("executionStats")
```

`db.killOp(<opid>)` stops an operation (with approval). The profiler adds overhead: leave level 1 with a sensible `slowms`, never level 2 in production.

## Indexes

```js
// Usage counters per index since the last restart: indexes with ops 0 are candidates to drop
db.orders.aggregate([{ $indexStats: {} }])
```

- Follow the ESR rule for compound indexes: Equality fields first, then Sort, then Range.
- Build indexes on large collections in a low-traffic window; on Atlas, rolling builds avoid a primary-wide impact.
- Hide an index (`db.orders.hideIndex("<name>")`) before dropping it, to test the impact reversibly.

## Memory

```js
const c = db.serverStatus().wiredTiger.cache
c["bytes currently in the cache"] / c["maximum bytes configured"]
```

A cache constantly near full with high read-into-cache rates means the working set does not fit: add memory or fix the queries reading too much.

## Replication

```js
rs.status()                  // member states and optimeDate per member: lag = primary optime - member optime
rs.printReplicationInfo()    // oplog size and the time window it covers
```

The **oplog window** must be longer than the longest a secondary can be down or lagging (maintenance, a slow restore); otherwise that member needs a full resync. Alert when it shrinks below a few hours on a busy cluster.
