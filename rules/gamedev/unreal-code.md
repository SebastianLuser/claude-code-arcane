---
paths:
  - "Source/**"
  - "Plugins/**/Source/**"
---

# Unreal Engine C++ Rules

- Every UObject reference held by another UObject must be a `TObjectPtr<>` marked `UPROPERTY()` — an unmarked pointer is invisible to the GC and becomes a dangling pointer
- Never `new`/`delete` a UObject — use `NewObject<>()` or `CreateDefaultSubobject<>()`; use `TSharedPtr`/`TUniquePtr`/`TWeakPtr` only for non-UObject types
- Follow engine naming: `U` for UObject, `A` for AActor, `F` for structs, `E` for enums, `I` for interfaces, `T` for templates
- Use `FName` for identifiers and lookups, `FText` for anything shown to a player, `FString` only for manipulation — never build display strings by concatenating `FString` for localized UI
- Use `TArray`/`TMap`/`TSet`, not STL containers, in any reflected or engine-facing code
- `Tick` is opt-in, not default: disable it (`PrimaryActorTick.bCanEverTick = false`) and use timers, delegates or events instead. Ticking work multiplied across instances is a measured cost, not an assumption
- ZERO allocations in hot paths (tick, animation, physics, rendering) — pre-allocate, pool and reuse
- Always call `Super::` in overridden engine functions (`BeginPlay`, `EndPlay`, `Tick`, `GetLifetimeReplicatedProps`, `PostInitializeComponents`)
- Every replicated `UPROPERTY(Replicated)` must appear in `GetLifetimeReplicatedProps` with a `DOREPLIFETIME` entry, and every Server RPC must validate its input — never trust the client
- Use soft references (`TSoftObjectPtr`, `TSoftClassPtr`) plus the Asset Manager for assets that are not always needed; a hard reference pulls the whole asset tree into memory
- No synchronous load of large assets on the game thread during gameplay — use `StreamableManager` / async loading
- UObject access happens on the game thread only; async completion paths must handle their owner being destroyed mid-flight
- Editor-only code lives in an editor module or behind `WITH_EDITOR`, and never ships in a runtime target
- Profile with Unreal Insights and `stat` commands before AND after every optimization — document the measured numbers
- Blueprint Nativization was removed in UE5; never propose it as an optimization

## Examples

**Correct** (GC-visible reference, no tick, validated RPC):

```cpp
UCLASS()
class AGate : public AActor
{
    GENERATED_BODY()

public:
    AGate()
    {
        PrimaryActorTick.bCanEverTick = false;  // event-driven, nothing to tick
    }

protected:
    virtual void BeginPlay() override
    {
        Super::BeginPlay();  // never skip Super
        OnActorBeginOverlap.AddDynamic(this, &AGate::HandleOverlap);
    }

    UFUNCTION(Server, Reliable, WithValidation)
    void ServerRequestOpen();

private:
    // TObjectPtr + UPROPERTY: the GC can see and keep this alive.
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Frame;

    // Soft reference: the VFX only loads when the gate actually opens.
    UPROPERTY(EditDefaultsOnly)
    TSoftObjectPtr<UNiagaraSystem> OpenEffect;
};

bool AGate::ServerRequestOpen_Validate()
{
    return true;
}

void AGate::ServerRequestOpen_Implementation()
{
    // Server re-checks authority and state; the client's word is not enough.
    if (!HasAuthority() || bIsLocked)
    {
        return;
    }
    OpenInternal();
}
```

**Incorrect** (invisible to GC, needless tick, trusted client, hot-path allocation):

```cpp
UCLASS()
class AGate : public AActor
{
    GENERATED_BODY()

    // VIOLATION: raw pointer with no UPROPERTY — GC cannot see it, this will dangle
    UStaticMeshComponent* Frame;

    // VIOLATION: hard reference, loads the VFX and its dependencies with this actor
    UPROPERTY()
    UNiagaraSystem* OpenEffect;

    virtual void BeginPlay() override
    {
        // VIOLATION: missing Super::BeginPlay()
        Frame = new UStaticMeshComponent();  // VIOLATION: never new a UObject
    }

    virtual void Tick(float DeltaTime) override
    {
        // VIOLATION: allocates every frame
        TArray<AActor*> Nearby;
        UGameplayStatics::GetAllActorsOfClass(GetWorld(), APawn::StaticClass(), Nearby);

        // VIOLATION: string comparison in a hot path — use FName or a tag
        for (AActor* A : Nearby)
        {
            if (A->GetName() == TEXT("BP_Player_C_0"))
            {
                OpenInternal();
            }
        }
    }

    UFUNCTION(Server, Unreliable)
    void ServerRequestOpen(bool bClientSaysUnlocked)
    {
        // VIOLATION: trusts a client-supplied authority decision
        if (bClientSaysUnlocked)
        {
            OpenInternal();
        }
    }
};
```
