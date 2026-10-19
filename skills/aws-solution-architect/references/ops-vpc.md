# Operate: VPC and networking

## Layout

- At least 2 AZs. **Public subnets** hold only load balancers and NAT gateways; **private subnets** hold tasks, functions and databases.
- **NAT gateway** per AZ for production (one shared NAT is a single point of failure and adds cross-AZ data charges); NAT is also a common surprise on the bill.
- **VPC endpoints** cut NAT traffic and keep traffic private: gateway endpoints for S3 and DynamoDB are free; interface endpoints (ECR, Secrets Manager, CloudWatch Logs) cost per hour but often less than the NAT data they replace.
- Plan CIDRs that do not overlap with other VPCs or offices you may peer or connect later.

## Security groups

- Reference security groups instead of IP ranges: the database's group allows port 5432 from the app's group only.
- No `0.0.0.0/0` inbound except on the public load balancer's 443 (and 80 for the redirect).
- Prefer SSM Session Manager over SSH: no inbound port, no keys to distribute, every session logged.

Network ACLs are stateless and easy to get wrong; leave them at the default unless a compliance rule asks for them.

## Debug "cannot connect"

1. **Route:** the source subnet's route table has a route to the destination (NAT for internet, endpoint, peering, transit gateway).
2. **Security groups:** the destination allows the port from the source's group; outbound rules allow it too.
3. **DNS:** the VPC has DNS resolution and hostnames on (needed for interface endpoints and RDS endpoints).
4. **Reachability Analyzer** checks the path between two resources without sending traffic:

```bash
aws ec2 create-network-insights-path --source <eni-or-instance> --destination <eni-or-instance> --protocol tcp --destination-port 5432
aws ec2 start-network-insights-analysis --network-insights-path-id <id>
```

**VPC Flow Logs** (to CloudWatch or S3) show accepted and rejected traffic; enable them on production VPCs and query rejects when a connection fails silently.
