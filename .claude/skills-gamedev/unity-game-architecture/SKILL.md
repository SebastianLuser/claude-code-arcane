---
name: unity-game-architecture
description: Arquitectura y optimización para proyectos Unity 6 modernos, inspirada en el roguelite turn-based Scholar-Duel (Tesis-UADE-2026). Cubre estructura de carpetas canónica, singletons con moderación, ScriptableObjects data-driven, composition over inheritance, state machines, event bus desacoplado, Input System nuevo, Addressables, presupuestos de performance (60 FPS), object pooling, memoria, save system versionado, testing y build pipeline. Usar cuando se mencione: arquitectura Unity, estructura Unity, optimización Unity, performance Unity, ScriptableObject, singleton Unity, object pool, Addressables, state machine Unity, build Unity, Scholar-Duel, Tesis-UADE, roguelite Unity, o cualquier decisión técnica/estructural en un proyecto Unity 6.
---

# Unity Game Architecture

Skill de arquitectura y optimización para proyectos Unity 6 (C#), con foco en equipos chicos (tipo tesis universitaria, 6 personas) que necesitan patrones probados sin caer en over-engineering. Inspirado en el proyecto real **Scholar-Duel / Tesis-UADE-2026**: roguelite turn-based con dados, 3D low poly + pixel shader, isométrico fijo, target PC.

## Cuándo usar

- Arrancás un proyecto Unity nuevo y querés una base sólida.
- Necesitás decidir entre singleton, SO event bus, state machine, etc.
- El juego empieza a laggear y no sabés por dónde atacar.
- Querés validar que la estructura `Assets/` no sea un quilombo.
- Vas a meter sistema de save, input, addressables, pooling.
- Antes de subir un build de release.

## Cuándo NO usar

- Necesitás diseño de mecánica/balance: usá `/doc-gdd`, `/doc-pas`, `/balance-check`, `/audit-game`.
- Necesitás scaffolding inicial de proyecto: usá `/scaffold-unity`.
- Es cuestión de arte/audio: usá `/art-bible`, `/asset-spec`.
- Profiling concreto de un cuello de botella: usá `/perf-profile`, `/performance-test`.

---

## 1. Filosofía

Unity 6 moderno, balance entre **simplicidad** (equipo chico, alcance de tesis) y **patrones probados** que no te traicionen al mes 4 del proyecto.

- **No ECS/DOTS** salvo necesidad real demostrada con Profiler. Para un roguelite turn-based no hace falta.
- **Escalar complejidad con el proyecto**, no desde el día 1. Un singleton está bien si lo necesitás. Un event bus está bien cuando hay 3+ sistemas hablándose.
- **Premature optimization is the root of all evil** — perfilá primero, optimizá después.
- **Lógica testeable desacoplada de MonoBehaviour** siempre que se pueda. Combat resolution, dice scoring, inventory math: C# puro.

---

## 2. Estructura de carpetas canónica

```
Assets/
  _Project/                <- todo lo nuestro bajo _Project
    Scripts/
      Core/                <- GameManager, SceneLoader, persistent singletons
      Gameplay/
        Combat/
        Dice/
        Movement/
        Enemies/
      Systems/             <- systems compuestos (Inventory, Progression)
      UI/
      Data/                <- ScriptableObjects definitions (clases SO)
      Utils/
    Prefabs/
    ScriptableObjects/     <- instances de SO (assets)
      Dice/
      Enemies/
      Items/
    Scenes/
    Art/
    Audio/
    Shaders/
  Plugins/
  ThirdParty/
```

**Regla de oro:** nunca `Assets/Scripts/` flat. Siempre bajo `_Project/` para separar tu código de Plugins / packages / asset store. El underscore lo deja arriba alfabéticamente.

**Sub-regla:** dentro de `Scripts/` agrupar por **feature**, no por tipo. `Scripts/Combat/` (con sus MonoBehaviours, SO, helpers) en vez de `Scripts/Managers/`, `Scripts/Helpers/`, `Scripts/Data/` cruzados.

---

## 3. Managers singletons (con moderación)

Para **state global persistente cross-scene**: `GameManager`, `AudioManager`, `SceneLoader`, `InputManager`.

```csharp
public class GameManager : MonoBehaviour {
    public static GameManager Instance { get; private set; }

    void Awake() {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
}
```

**Cuándo SÍ singleton:**
- State global persistente cross-scene (run state, settings, audio mixer).
- Sistemas únicos por definición (input, scene loader).

**Cuándo NO:**
- Todo lo demás. Cada nuevo singleton es un acoplamiento global.
- Si lo necesitás solo en una escena: ponelo en la escena y referencialo via `[SerializeField]` o SO event.
- Si abusás → "ManagerManager syndrome", código imposible de testear y refactorizar.

---

## 4. ScriptableObjects para data-driven design

Definí dados, enemigos, items, habilidades, encantamientos como **SO assets**. Separá **definición** (data) de **lógica** (MonoBehaviour / clases puras).

```csharp
[CreateAssetMenu(menuName = "Dice/Dice Definition")]
public class DiceSO : ScriptableObject {
    public string displayName;
    public DiceFace[] faces = new DiceFace[6];
    public Sprite icon;
    public int dicePowerCost;
}

[System.Serializable]
public class DiceFace {
    public FaceType type;        // Number, Skill, Curse, etc.
    public int value;
    public Sprite sprite;
}
```

**Ventajas:**
- Designer edita en inspector, sin tocar código.
- Hot-swappable en Play Mode.
- Compartido por referencia → performance (no se duplica en cada instancia).
- Testeable: fácil crear SO de test en runtime con `ScriptableObject.CreateInstance<>()`.
- Versionable en git como assets `.asset`.

**Patrón típico:** un SO `EnemySO` con stats + un MonoBehaviour `Enemy` que recibe el SO via inspector y aplica el comportamiento.

---

## 5. Composition over inheritance

Cada entidad = GameObject con **componentes pequeños**. No hagas `class Player : Character : Entity : MonoBehaviour` con 4 niveles de herencia.

```csharp
// Player como composición:
// GameObject "Player"
//   - Health             (componente)
//   - Movement           (componente)
//   - DiceInventory      (componente)
//   - PlayerInputHandler (componente)
//   - Animator (built-in)

public class Health : MonoBehaviour {
    [SerializeField] private int maxHp = 100;
    public int CurrentHp { get; private set; }
    public event System.Action<int> OnDamaged;
    public event System.Action OnDied;

    void Awake() => CurrentHp = maxHp;

    public void TakeDamage(int amount) {
        CurrentHp = Mathf.Max(0, CurrentHp - amount);
        OnDamaged?.Invoke(amount);
        if (CurrentHp == 0) OnDied?.Invoke();
    }
}
```

Beneficio: reusás `Health` en player, enemigos, props destructibles. Cero herencia.

---

## 6. State Machine para entidades complejas

Combat turns, enemy AI, UI flows, screen transitions. **Cada cosa con muchos modos = FSM**.

```csharp
public interface IState {
    void Enter();
    void Tick();
    void Exit();
}

public class StateMachine {
    private IState current;

    public void Change(IState next) {
        current?.Exit();
        current = next;
        current?.Enter();
    }

    public void Tick() => current?.Tick();
}

// Ejemplo: turno de combate
public class PlayerRollState : IState {
    public void Enter() { /* habilitar UI de hold/roll */ }
    public void Tick()  { /* esperar input */ }
    public void Exit()  { /* deshabilitar UI */ }
}
```

**Casos típicos en Scholar-Duel:**
- `CombatTurnFSM`: PlayerRoll → Hold → Reroll → Resolve → EnemyTurn → Cleanup.
- `EnemyAI_FSM`: Idle → Telegraph → Attack → Recover.
- `MenuFlowFSM`: MainMenu → Loadout → Run → GameOver.

---

## 7. Event bus / SO-based events para desacoplamiento

Evitá `GameManager.Instance.FindThing().Notify()`. Spaghetti garantizado. Usá **SO events**:

```csharp
[CreateAssetMenu(menuName = "Events/Game Event")]
public class GameEventSO : ScriptableObject {
    private readonly List<GameEventListener> listeners = new();

    public void Raise() {
        for (int i = listeners.Count - 1; i >= 0; i--)
            listeners[i].OnRaised();
    }

    public void Register(GameEventListener l)   => listeners.Add(l);
    public void Unregister(GameEventListener l) => listeners.Remove(l);
}

public class GameEventListener : MonoBehaviour {
    [SerializeField] private GameEventSO @event;
    [SerializeField] private UnityEvent response;

    void OnEnable()  => @event.Register(this);
    void OnDisable() => @event.Unregister(this);
    public void OnRaised() => response.Invoke();
}
```

**Ventajas para teams chicos:**
- Editor-friendly: drag & drop de SO event en inspector.
- Cero referencias directas entre sistemas.
- Fácil de mockear en tests.
- Alternativa light a frameworks pesados (Zenject, MessagePipe).

**Variantes útiles:** `GameEventSO<T>` con payload (ej: `IntEventSO` para "playerTookDamage").

---

## 8. Input System (nuevo)

**No** uses `Input.GetKey` legacy. Usá el package `com.unity.inputsystem`:

- Generá un asset `.inputactions`, definí action maps (Player, UI, Combat).
- Auto-genera C# wrapper class.
- Abstrae keyboard / gamepad / touch. Importante para PC + posible expansión.
- Rebinding en runtime built-in (importante para accesibilidad — uno de los pillars del proyecto).

```csharp
public class PlayerInputHandler : MonoBehaviour {
    private GameInputs inputs;

    void Awake() {
        inputs = new GameInputs();
        inputs.Combat.Roll.performed += _ => OnRoll();
    }
    void OnEnable()  => inputs.Combat.Enable();
    void OnDisable() => inputs.Combat.Disable();

    private void OnRoll() { /* ... */ }
}
```

---

## 9. Addressables para assets pesados

**Evitá** `Resources/` folder (carga blocking, todo el contenido va al build).

**Addressables** te dan:
- Carga **async** (no congela el frame).
- **Memory management** explícito (`Release` cuando no lo usás).
- Build separado → posible **DLC / patches** sin re-build del binario.
- Catálogos remotos (CDN) si algún día crece.

```csharp
AsyncOperationHandle<EnemySO> handle = Addressables.LoadAssetAsync<EnemySO>("Goblin");
EnemySO data = await handle.Task;
// ... usar data ...
Addressables.Release(handle);
```

Para un thesis project: usá Addressables al menos para escenas y enemigos/items pesados. Settings, UI prefabs livianos pueden ir directo.

---

## 10. Performance budgets (60 FPS target)

Para PC el target razonable es **60 FPS estable**, idealmente 144 si se puede.

| Métrica | Budget |
|---|---|
| CPU main thread / frame | < 16ms (60fps) o < 6.94ms (144fps) |
| GC allocations en hot loop | **0** por frame |
| Draw calls | < 200 (batch + atlas + GPU instancing) |
| SetPass calls | minimizar (cambio de shader/material caro) |
| Vertex count visible | dependiente del HW target, profile en GPU |

**Cómo medir:** Unity Profiler (CPU, GPU, Memory), Frame Debugger, Memory Profiler package.

---

## 11. Patrones de optimización clave

- **Object Pooling** para proyectiles, VFX, enemies spawneados, dados visuales. Usá `UnityEngine.Pool.ObjectPool<T>` (built-in 2021+).

  ```csharp
  private ObjectPool<DiceVisual> pool;

  void Awake() {
      pool = new ObjectPool<DiceVisual>(
          createFunc: () => Instantiate(dicePrefab),
          actionOnGet: d => d.gameObject.SetActive(true),
          actionOnRelease: d => d.gameObject.SetActive(false),
          actionOnDestroy: d => Destroy(d.gameObject),
          defaultCapacity: 10, maxSize: 50);
  }
  ```

- **Cache `Transform` y `GetComponent`** en `Awake`, no cada frame. `transform` ya no es lento desde Unity 5+, pero `GetComponent` sí.
- **Evitar `Instantiate` / `Destroy` en hot path** → usar pool.
- **Coroutines vs async/await:** coroutines para secuencias game-bound (esperas por frame, animaciones); async para I/O (red, disco). Para zero-alloc async serio: **UniTask**.
- **Burst + Jobs** solo si hay hot loop matemático probado (pathfinding, simulaciones masivas). En Scholar-Duel turn-based: probablemente innecesario.
- **LOD groups** para meshes 3D distantes.
- **Occlusion culling** en escenas grandes (dungeons multi-room).
- **Texture atlases** + sprite packing 2D (UI, pixel art layer).
- **GPU Instancing** para muchos del mismo (enemies del mismo tipo, props repetidos).
- **Static batching** para geometry fija (paredes, decoración del dungeon).

---

## 12. Memory

- `SceneManager.UnloadSceneAsync` al terminar una room/floor en Additive loading.
- `Resources.UnloadUnusedAssets()` tras cambio de escena grande (no por frame, eh).
- Preferí **Addressables** sobre Resources (control real de memoria).
- No metas texturas 4K si el target es 1080p. Setteá max size por plataforma en import settings.
- Mesh compression: medium/high para assets que no necesitan precisión geométrica.

---

## 13. Save system

- **JSON** (JsonUtility o Newtonsoft) en `Application.persistentDataPath` para saves de run y meta-progresión.
- **PlayerPrefs** solo para settings (volumen, resolución, key bindings).
- **Versión de save + migración**: cada save lleva `version: int`. Si el code esperaba v3 y abrís v1, corré migrators v1→v2→v3.
- **NO** uses `BinaryFormatter` (deprecado, inseguro, vector de exploits).
- Considerá save **atómico**: escribí a `save.tmp`, validá, renombrá a `save.json`. Evitás corrupción si crashea mid-write.

```csharp
[System.Serializable]
public class SaveDataV3 {
    public int version = 3;
    public RunState run;
    public MetaProgression meta;
}
```

---

## 14. Testing

- **Unity Test Framework (NUnit)** para lógica pura (no MonoBehaviour). Combat resolution, dice scoring, inventory math: testeables sin Play Mode.
- **PlayMode tests** para interacciones MonoBehaviour cuando hace falta (animaciones, físicas).
- **Separá lógica de gameplay del wrapper MonoBehaviour**:

  ```csharp
  // Pura, testeable:
  public static class ComboResolver {
      public static ComboResult Resolve(int[] diceFaces) { /* ... */ }
  }

  // Wrapper MonoBehaviour:
  public class CombatController : MonoBehaviour {
      public void Roll() {
          var result = ComboResolver.Resolve(currentDice);
          ApplyResult(result);
      }
  }
  ```

  Ahora podés testear `ComboResolver` sin Unity corriendo.

---

## 15. Coroutines pitfalls

`yield return new WaitForSeconds(1f)` **aloca cada llamada**. En un loop, basura para el GC.

```csharp
public class Telegraph : MonoBehaviour {
    private static readonly WaitForSeconds OneSec = new WaitForSeconds(1f);
    private static readonly WaitForEndOfFrame EndFrame = new WaitForEndOfFrame();

    IEnumerator FlashWarning() {
        for (int i = 0; i < 3; i++) {
            // toggle visual
            yield return OneSec;   // sin alloc
        }
    }
}
```

Lo mismo para `WaitForFixedUpdate`, `WaitForEndOfFrame`. Cacheá.

---

## 16. Tooling del equipo

- **IDE: Rider / IntelliJ IDEA** (regla del proyecto Tesis-UADE — **nunca VS Code**).
- **Version control: Git + Git LFS** para assets binarios (`.png`, `.fbx`, `.wav`, `.psd`).
- `.gitignore` estándar Unity (`Library/`, `Temp/`, `Builds/`, `Logs/`, `obj/`, `*.csproj`, `*.sln`).
- **Unity Smart Merge** configurado para `.unity` y `.prefab` (mergetool en `.git/config`).
- **Force Text serialization** en Project Settings (default desde hace años, verificá igual).
- **Visible Meta Files** ON.

---

## 17. Build pipeline

- **IL2CPP** para release (mejor performance, build más lento).
- **Mono** para development builds (build rápido, iteración).
- **Stripping level engine: Medium o High** para reducir binario.
- **Addressables build** como step previo al Player build.
- **Development Build + Autoconnect Profiler** para sesiones de profiling.
- Automatizá con un script de build (`MenuItem` o CI) para no olvidarte settings entre releases.

---

## 18. Ejemplo completo aplicado a Scholar-Duel

Combat turn end-to-end, juntando todo:

```csharp
// 1. SO con definición del dado
[CreateAssetMenu(menuName = "Dice/Dice Definition")]
public class DiceSO : ScriptableObject { /* ver sección 4 */ }

// 2. Pool de visuales de dados spawneados
public class DiceSpawner : MonoBehaviour {
    [SerializeField] private DiceVisual prefab;
    private ObjectPool<DiceVisual> pool;
    void Awake() {
        pool = new ObjectPool<DiceVisual>(
            () => Instantiate(prefab),
            d => d.gameObject.SetActive(true),
            d => d.gameObject.SetActive(false),
            d => Destroy(d.gameObject),
            defaultCapacity: 8, maxSize: 24);
    }
    public DiceVisual Spawn(DiceSO data) {
        var v = pool.Get();
        v.Bind(data);
        return v;
    }
    public void Despawn(DiceVisual v) => pool.Release(v);
}

// 3. SO event para "turn started"
[CreateAssetMenu(menuName = "Events/Combat/Turn Started")]
public class TurnStartedEventSO : GameEventSO { }

// 4. FSM del turno
public class CombatController : MonoBehaviour {
    [SerializeField] private TurnStartedEventSO turnStarted;
    private StateMachine fsm = new();

    void Start() {
        fsm.Change(new PlayerRollState(this));
        turnStarted.Raise();
    }
    void Update() => fsm.Tick();
}

// 5. Lógica pura, testeable sin Play Mode
public static class ComboResolver {
    public static ComboResult Resolve(int[] faces) { /* ... */ }
}
```

Performance budget aplicado:
- Pool de dados → 0 Instantiate en hot loop.
- ComboResolver puro → 0 alloc, testeable.
- SO event → cero acoplamiento entre `CombatController` y UI/SFX/VFX que reaccionan.

---

## Anti-patterns (NO HACER)

- ❌ `Scripts/` flat en `Assets/` (colisiona con Plugins, código del Asset Store).
- ❌ Singleton para todo (ManagerManager syndrome).
- ❌ `GameObject.Find` / `FindObjectOfType` en `Update` (scan full hierarchy = lento).
- ❌ `GetComponent` en `Update` sin cachear.
- ❌ `Instantiate` / `Destroy` en hot path (usar pool).
- ❌ Lógica de gameplay metida en MonoBehaviour sin capa pura testeable.
- ❌ LINQ `.ToList()` / `.Where()` en `Update` (allocations por frame).
- ❌ `new Vector3(...)` cada frame cuando podés reutilizar.
- ❌ String concatenation con `+` en logs dentro de `Update`.
- ❌ `public` fields everywhere (usá `[SerializeField] private`).
- ❌ Prefabs con referencias cruzadas rotas (orphans tras refactor).
- ❌ Escenas monolíticas (partir en Additive loading).
- ❌ Ignorar Profiler hasta que el juego ya lagea.
- ❌ Save format binario sin versión (save corrupta al primer update).
- ❌ `Resources/` folder para todo (carga blocking + ocupa memoria siempre).
- ❌ ECS/DOTS en proyecto que no lo necesita (complejidad enorme, equipo no preparado).
- ❌ Premature optimization sin Profiler — perfilá primero, optimizá después.
- ❌ Usar VS Code en este proyecto (regla del equipo: IntelliJ IDEA / Rider).

---

## Checklist de review

- [ ] Estructura `Assets/_Project/Scripts/` correcta, agrupada por feature.
- [ ] Singletons solo para state persistente cross-scene.
- [ ] Data en ScriptableObjects, no hardcoded en MonoBehaviours.
- [ ] Lógica de gameplay testeable sin Play Mode (clases puras separadas).
- [ ] Object Pooling en entidades spawneadas frecuentemente.
- [ ] `Transform` y componentes cacheados en `Awake`.
- [ ] GC allocations en hot loops revisadas con Profiler.
- [ ] Input via Input System nuevo, no legacy `Input.GetKey`.
- [ ] Save system con `version` + migrators, JSON (no BinaryFormatter).
- [ ] Escenas grandes con Additive loading.
- [ ] Addressables para assets pesados, no `Resources/`.
- [ ] `WaitForSeconds` cacheados en coroutines.
- [ ] `.gitignore` Unity correcto + Git LFS para binarios.
- [ ] Build IL2CPP + stripping configurado para release.
- [ ] Profiler ejecutado al menos una vez antes de cerrar milestone.

---

## ✅ Output esperado

Al aplicar esta skill, el proyecto Unity queda con:

- ✅ Estructura `_Project/` canónica.
- ✅ Patrones de arquitectura claros (singletons acotados, SO data, FSM, SO events).
- ✅ Performance budget definido y medible.
- ✅ Save system versionado y robusto.
- ✅ Lógica gameplay testeable.
- ✅ Build pipeline reproducible.
- ✅ **Proyecto setup** listo para escalar sin re-arquitecturas dolorosas a mitad de desarrollo.

---

## Delegación a otras skills

| Skill | Cuándo |
|---|---|
| `/scaffold-unity` | Crear proyecto Unity desde cero con esta estructura. |
| `/balance-check` | Validar probabilidades de combos, balance numérico. |
| `/art-bible` | Definir dirección de arte (low poly + pixel shader). |
| `/asset-spec` | Especificar assets concretos (props, enemies, UI). |
| `/audit-game` | Auditoría integral GDD vs specs vs código. |
| `/playtest-report` | Procesar resultados de playtests. |
| `/doc-gdd` | Game Design Document completo. |
| `/review-all-gdds` | Review cruzado de todos los GDDs. |
| `/perf-profile` | Profiling concreto de un cuello de botella. |
| `/performance-test` | Suite de tests de performance automatizables. |
| `/team-combat` | Coordinación con el feature team de combate. |
| `/team-level` | Coordinación con el feature team de level design. |
| `/team-polish` | Coordinación con el feature team de polish/juiciness. |
