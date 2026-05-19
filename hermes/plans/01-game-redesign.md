# Redesign da Tela de Jogo — Plano de Implementação

> **Para Hermes:** Usar subagent-driven-development para implementar tarefa por tarefa.
>
> **Diagrama de navegação:** https://excalidraw.com/#json=k-T89oxXItpO_jFCgHR-z,xv6XPjijd66R0q2wsKgmsg

**Goal:** Substituir a tela de jogo atual (placar horizontal simples, config fixa) por uma tela no estilo placar esportivo com fundo azul/vermelho, menu de ações sempre visível, modal de configurações completo (duas colunas, times editáveis, sets, margem, cronômetro), sistema de sets toggle, deslizar pra diminuir, histórico acessível do jogo.

**Arquitetura:**
- Toda a lógica do jogo fica no `AppContext` (não extrair GameContext — YAGNI por enquanto)
- GameConfig vira um modal sobreposto (não tela separada)
- Sets ON/OFF toggle no config: OFF = comportamento atual (pontos corridos), ON = melhor de X sets com margem
- Menu de 8 ações sempre visível no centro da tela (➕ ↩ ⇄ 📈 / ⊞ 🖥 ⭐ ⚙️)
- Swipe down (touch) em cada metade = decrementa placar

**Tech Stack:** React 19, TypeScript, TailwindCSS 3, Framer Motion, Lucide React, Emoji-picker-react (nova dep)

---

## Tarefas

---

### Tarefa 1: Atualizar tipos (GameConfig, GameSession, Team)

**Objetivo:** Expandir os tipos para suportar sets, margem, timer, nome/emoji por time

**Arquivos:**
- Modificar: `src/types/index.ts`

**Mudanças:**

```typescript
// GameConfig — novo formato
export interface GameConfig {
  // Modo de jogo
  setsEnabled: boolean;       // toggle SETS
  pointsToWin: number;        // pontos pra vencer o set (ex: 10)
  margin: number;             // margem de diferença (ex: 1 = game point, 2 = deuce)
  setsToWin: number;          // melhor de X sets (ex: 3)
  
  // Timer (visual only)
  timerEnabled: boolean;      // toggle CRONÔMETRO
  timerDuration: number;      // minutos (ex: 10)
  timerCountdown: boolean;    // toggle contagem regressiva
  timerSound: boolean;        // toggle som do cronômetro
  
  // Geral
  swipeToDecrease: boolean;   // toggle deslizar pra diminuir
  vibration: boolean;         // toggle vibração
  askSetWinner: boolean;      // toggle perguntar quem venceu o set
  language: string;           // "português (brasil)"
}

// Team — adicionar name + emoji editáveis
export interface Team {
  id: number;
  members: Person[];
  captain: Person | null;
  name: string;        // ← NOVO: editável (padrão: "Time {id}")
  emoji: string;       // ← NOVO: emoji (padrão: sorteado aleatório)
}

// MatchResult — adicionar info de set
export interface MatchResult {
  id: string;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  score1: number;
  score2: number;
  setNumber: number;       // ← NOVO: número do set
  setScores1: number[];    // ← NOVO: histórico de sets (ex: [10, 8, 10])
  setScores2: number[];    // ← NOVO: histórico de sets (ex: [8, 10, 5])
  winner: 'team1' | 'team2';
}

// GameSession — expandido para sets
export interface GameSession {
  isActive: boolean;
  config: GameConfig;
  allTeams: Team[];          // ← Team agora tem name/emoji
  queue: number[];
  playing: [number, number] | null;
  scores: [number, number];
  setScores1: number[];      // ← NOVO: pontuação de cada set (time 1)
  setScores2: number[];      // ← NOVO: pontuação de cada set (time 2)
  currentSet: number;        // ← NOVO: set atual (1-indexed)
  wins: Record<number, number>;
  matchHistory: MatchResult[];
}
```

**Verificar:** `npx tsc --noEmit` sem erros

---

### Tarefa 2: Adicionar emoji-picker-react como dependência

**Objetivo:** Instalar dependência pra seletor de emoji dos times

**Arquivos:**
- Modificar: `package.json`

**Comando:**
```bash
cd /home/psousaj/sorteador-equipes && npm install emoji-picker-react
```

**Verificar:** `package.json` tem `"emoji-picker-react"` nas dependências

---

### Tarefa 3: Atualizar estado inicial do game no AppContext

**Objetivo:** O estado inicial do jogo deve refletir os novos tipos

**Arquivos:**
- Modificar: `src/context/AppContext.tsx` (linhas ~41-51)

**Mudanças:**
```typescript
game: {
  isActive: false,
  config: {
    setsEnabled: false,
    pointsToWin: 10,
    margin: 1,
    setsToWin: 3,
    timerEnabled: false,
    timerDuration: 10,
    timerCountdown: false,
    timerSound: true,
    swipeToDecrease: true,
    vibration: false,
    askSetWinner: false,
    language: 'português (brasil)',
  },
  allTeams: [],
  queue: [],
  playing: null,
  scores: [0, 0],
  setScores1: [],
  setScores2: [],
  currentSet: 1,
  wins: {},
  matchHistory: [],
}
```

**Verificar:** `npx tsc --noEmit` sem erros

---

### Tarefa 4: Atualizar ResultScreen (START_GAME) com novos campos

**Objetivo:** Ao iniciar partida, gerar `name + emoji` para cada time e passar config expandida

**Arquivos:**
- Modificar: `src/screens/ResultScreen.tsx`

**Mudanças:**
```typescript
// Ao clicar "Iniciar Partida" (sem modal de config inicial — agora config é só do ⚙️ no Game)
dispatch({
  type: 'START_GAME',
  payload: {
    config: defaultGameConfig,  // config padrão
    teams: currentResult.teams.map(t => ({
      ...t,
      name: `Time ${t.id}`,
      emoji: randomTeamEmoji(),  // função helper
    })),
  },
});
```

Criar um array de emojis disponíveis e função `randomTeamEmoji()` no ResultScreen (ou num arquivo helper).

**Emojis sugeridos pra times:** 🦁🐯🦅🐉🦈🐺🦊🐼🐨🦄🐲🐸🦋🐙🦀

**Verificar:** Navegar Resultado → Iniciar Partida → tela de jogo abre sem erro

---

### Tarefa 5: Atualizar SCORE_POINT no reducer (lógica de sets)

**Objetivo:** Quando setsEnabled=false, comportamento igual ao atual (pontos corridos + rotação). Quando setsEnabled=true, a partida vira "melhor de X sets": cada set tem pointsToWin pontos com margem, e o vencedor de cada set ganha 1 ponto no sets. Quem vencer setsToWin sets vence a partida.

**Arquivos:**
- Modificar: `src/context/AppContext.tsx` (case 'SCORE_POINT')

**Lógica detalhada:**

```typescript
case 'SCORE_POINT': {
  const { game } = state;
  if (!game.playing || !game.isActive) return state;

  const side = action.payload.side;
  const newScores: [number, number] = [...game.scores];
  newScores[side === 'team1' ? 0 : 1] += 1;

  // Se sets estão desligados → comportamento atual (pontos corridos + rotação)
  if (!game.config.setsEnabled) {
    // ... código existente do SCORE_POINT (checar pointsToWin, winLimit, rotação)
    // manter exatamente como está hoje, a única diferença é que GameConfig
    // agora tem margin ao invés de deuce
    return existingBehavior();
  }

  // Sets ligados → verificar se alguém venceu o SET
  const ptw = game.config.pointsToWin;
  const margin = game.config.margin;
  
  const team1Won = newScores[0] >= ptw && (newScores[0] - newScores[1]) >= margin;
  const team2Won = newScores[1] >= ptw && (newScores[1] - newScores[0]) >= margin;

  if (!team1Won && !team2Won) {
    // Set ainda rolando
    return { ...state, game: { ...game, scores: newScores } };
  }

  // Set terminou! Registrar resultado do set
  const winnerSide = team1Won ? 'team1' : 'team2';
  const winnerId = winnerSide === 'team1' ? game.playing[0] : game.playing[1];
  
  // Armazenar pontuação do set no histórico
  const newSetScores1 = [...game.setScores1, newScores[0]];
  const newSetScores2 = [...game.setScores2, newScores[1]];

  // Verificar se venceu a PARTIDA (maioria dos sets)
  let team1Sets = newSetScores1.filter((_, i) => newSetScores1[i] > newSetScores2[i]).length;
  let team2Sets = newSetScores2.filter((_, i) => newSetScores2[i] > newSetScores1[i]).length;

  if (team1Sets >= game.config.setsToWin || team2Sets >= game.config.setsToWin) {
    // Alguém venceu a partida! Registrar, fazer rotação
    const winnerSideFinal = team1Sets >= game.config.setsToWin ? 'team1' : 'team2';
    // ... registrar matchResult com todos os sets, fazer rotação dos times
  } else {
    // Próximo set — zerar scores, incrementar currentSet
    return {
      ...state,
      game: {
        ...game,
        scores: [0, 0],
        setScores1: newSetScores1,
        setScores2: newSetScores2,
        currentSet: game.currentSet + 1,
      },
    };
  }
}
```

**Detalhe importante:** A margem também se aplica a sets ON. Ex: `pointsToWin=10, margin=2` → precisa de 10+ pontos E 2 de diferença.

**Verificar:** Testar manualmente com sets ON e OFF no navegador

---

### Tarefa 6: Atualizar END_MATCH no reducer

**Objetivo:** Atualizar END_MATCH para também funcionar com setsEnabled

**Arquivos:**
- Modificar: `src/context/AppContext.tsx` (case 'END_MATCH')

**Mudanças:** Similar ao SCORE_POINT — quando setsEnabled=false, mesmo comportamento de hoje. Quando setsEnabled=true, ao encerrar manualmente, registrar set parcial e vencedor.

**Simplificação:** Ao encerrar partida manualmente com sets ON, considerar o set atual como "incompleto" e ignorar (ou contar como vitória de quem tá na frente). O ideal é que END_MATCH sempre feche a partida atual e faça a rotação independente do estado do set.

---

### Tarefa 7: Construir o GameConfig Modal (componente)

**Objetivo:** Modal de configurações completo, duas colunas, idêntico ao layout da referência

**Arquivos:**
- Criar: `src/components/GameConfigModal.tsx`

**Estrutura do modal:**
```
┌─────────────────────────────────────────────┐
│  < CONFIGURAÇÕES                    🔄      │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ GERAL        │  │ TIMES                │ │
│  │              │  │                      │ │
│  │ 🌐 Português │  │ 🦁 Time 1  (editar) │ │
│  │    (brasil)  │  │ 🐯 Time 2  (editar) │ │
│  │              │  │ 🦅 Time 3  (editar) │ │
│  │ ☝ Deslizar   │  │ 🐉 Time 4  (editar) │ │
│  │   pra dim. ✓ │  └──────────────────────┘ │
│  │              │                           │
│  │ 📳 Vibração  │  ┌──────────────────────┐ │
│  │              │  │ PARTIDA              │ │
│  │ ❓ Atribuir  │  │                      │ │
│  │   set?      │  │ 👑 Pontos/set [—]10[+]│ │
│  │              │  │ ↔ Margem    [—]2 [+] │ │
│  │ ÁUDIO       │  │ 🏆 Sets/part [—]3 [+] │ │
│  │ 🔈 Voz ✓    │  └──────────────────────┘ │
│  │ 🎙 Tipo 1   │                           │
│  │ 🎛 Veloc.   │  ┌──────────────────────┐ │
│  │ 💬 {p1}a{p2}│  │ CRONÔMETRO           │ │
│  └──────────────┘  │ ⏱ Duração   10min   │ │
│                     │ ⏰ Contagem reg. ✓  │ │
│                     │ 🔈 Som ✓           │ │
│                     └──────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Coluna esquerda: GERAL + ÁUDIO (visual apenas, stub)
- Coluna direita: TIMES (listar times, clicar abre inline editor de nome + emoji picker), PARTIDA (inputs num com [+] [—]), CRONÔMETRO (toggles)
- Botão 🔄 reset (volta configurações padrão)
- Fechar com X ou backdrop click
- Props: `isOpen`, `onClose`, `config: GameConfig`, `teams: Team[]`, `onConfigChange`, `onTeamChange`

**Emoji picker:** Usar `emoji-picker-react` — ao clicar no emoji de um time, abre o picker. Ao selecionar, fecha e salva.

**Verificar:** Modal abre/fecha sem erro, inputs funcionam

---

### Tarefa 8: Construir o Tema Modal (componente)

**Objetivo:** Modal "Escolher tema" idêntico à referência — 4 opções de toggle (Orientação, Escuro, Cronômetro, Sets) + preview do placar

**Arquivos:**
- Criar: `src/components/ThemeModal.tsx`

**Funcionalidades:**
- Título com ícone de 4 quadradinhos
- 4 opções lado a lado: Orientação | Escuro | Cronômetro | Sets
- Preview do placar (mini) com cor simbólica azul/vermelho
- "Orientação" = troca player1/player2 de lado
- "Escuro" = toggle tema escuro
- "Cronômetro" e "Sets" são atalhos pros toggles no Config Modal
- Fechar com X ou backdrop

**Verificar:** Modal abre, toggles funcionam

---

### Tarefa 9: Redesenhar GameScreen (placar estilo referência)

**Objetivo:** Substituir a tela de jogo atual pela nova versão com:
- Fundo dividido azul/vermelho ocupando tela inteira
- Peões de xadrez como decoração (baixa opacidade)
- Mascotes (sapo / vaca) — usar emoji 🐸🐄
- Nome do time grande bold em branco em cada metade
- Placar numérico GIGANTE centralizado
- Placar de sets entre os placares (quando setsEnabled)
- Cronômetro no centro-superior (quando timerEnabled)
- Menu de ações sempre visível entre as metades
- Clique na metade = +1 ponto
- Swipe down na metade = -1 ponto
- Dropdown de histórico sobreposto (📈)

**Arquivos:**
- Reescrever: `src/screens/GameScreen.tsx`

**Estrutura:**
```typescript
function GameScreen() {
  // Estado local
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Fundo azul/vermelho dividido */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-[#2979D0] relative overflow-hidden">
          {/* Decoração: peões */}
          <div className="absolute opacity-[0.08] text-[200px] top-[-30px] left-[-30px]">♟</div>
          <div className="absolute opacity-[0.08] text-[120px] bottom-[-20px] right-[-20px]">♟</div>
          {/* Mascote */}
          <div className="absolute top-4 right-4 text-4xl">🐸</div>
        </div>
        <div className="w-1/2 bg-[#C0392B] relative overflow-hidden">
          <div className="absolute opacity-[0.08] text-[200px] top-[-30px] right-[-30px]">♟</div>
          <div className="absolute opacity-[0.08] text-[120px] bottom-[-20px] left-[-20px]">♟</div>
          <div className="absolute top-4 left-4 text-4xl">🐄</div>
        </div>
      </div>

      {/* Timer (quando timerEnabled) */}
      {game.config.timerEnabled && (
        <div className="relative z-10 flex justify-center pt-4">
          <div className="bg-white/90 rounded-full px-4 py-1 text-sm font-mono shadow">
            ▶ {formatTimer()} ↺
          </div>
        </div>
      )}

      {/* Placar de sets (quando setsEnabled) */}
      {game.config.setsEnabled && (
        <div className="relative z-10 flex justify-center mt-2">
          <div className="bg-white/90 rounded-xl px-6 py-1.5 shadow flex items-center gap-6">
            <span className="text-2xl font-bold text-[#2979D0]">{team1Sets}</span>
            <span className="text-xs text-gray-400 font-semibold">SETS</span>
            <span className="text-2xl font-bold text-[#C0392B]">{team2Sets}</span>
          </div>
        </div>
      )}

      {/* Nomes + Placar */}
      <div className="relative z-10 flex-1 flex">
        {/* Time 1 (azul) */}
        <div
          className="w-1/2 flex flex-col items-center justify-center cursor-pointer select-none text-white"
          onClick={() => dispatch({ type: 'SCORE_POINT', payload: { side: 'team1' } })}
          onTouchStart={(e) => game.config.swipeToDecrease && setTouchStartY(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (game.config.swipeToDecrease && touchStartY) {
              const diff = e.changedTouches[0].clientY - touchStartY;
              if (diff > 50) dispatch({ type: 'SCORE_POINT', payload: { side: 'team1', subtract: true } });
              setTouchStartY(null);
            }
          }}
        >
          <h1 className="text-3xl sm:text-5xl font-black mb-2">{team1.emoji} {team1.name}</h1>
          <div className="text-8xl sm:text-9xl font-black tabular-nums leading-none">
            {game.scores[0]}
          </div>
        </div>

        {/* Menu central */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-2xl shadow-xl p-3 flex flex-col gap-2 items-center">
            <div className="flex gap-3">
              <MenuButton icon="➕" dark />
              <MenuButton icon="↩" onClick={undoLastPoint} />
              <MenuButton icon="⇄" onClick={swapSides} />
              <MenuButton icon="📈" onClick={() => setShowHistory(true)} />
            </div>
            <div className="flex gap-3">
              <MenuButton icon="⊞" onClick={() => setShowTheme(true)} />
              <MenuButton icon="🖥" disabled />
              <MenuButton icon="⭐" />
              <MenuButton icon="⚙️" onClick={() => setShowConfig(true)} />
            </div>
          </div>
        </div>

        {/* Time 2 (vermelho) */}
        <div
          className="w-1/2 flex flex-col items-center justify-center cursor-pointer select-none text-white"
          onClick={() => dispatch({ type: 'SCORE_POINT', payload: { side: 'team2' } })}
          onTouchStart={(e) => game.config.swipeToDecrease && setTouchStartY(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (game.config.swipeToDecrease && touchStartY) {
              const diff = e.changedTouches[0].clientY - touchStartY;
              if (diff > 50) dispatch({ type: 'SCORE_POINT', payload: { side: 'team2', subtract: true } });
              setTouchStartY(null);
            }
          }}
        >
          <h1 className="text-3xl sm:text-5xl font-black mb-2">{team2.emoji} {team2.name}</h1>
          <div className="text-8xl sm:text-9xl font-black tabular-nums leading-none">
            {game.scores[1]}
          </div>
        </div>
      </div>

      {/* Modais */}
      <GameConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} ... />
      <ThemeModal isOpen={showTheme} onClose={() => setShowTheme(false)} ... />
      <HistoryDropdown isOpen={showHistory} onClose={() => setShowHistory(false)} ... />
    </div>
  );
}
```

**Nota:** O `SCORE_POINT` com `subtract: true` precisa ser adicionado ao reducer — decrementa (mínimo 0) ao invés de incrementar.

**Verificar:** Tela de jogo renderiza com fundo azul/vermelho, cliques fazem ponto, menu aparece

---

### Tarefa 10: MenuButton component

**Objetivo:** Botão do menu de ações (arredondado, 40px, com opção de fundo escuro)

**Arquivos:**
- Criar: `src/components/MenuButton.tsx`

```typescript
interface MenuButtonProps {
  icon: string;
  onClick?: () => void;
  dark?: boolean;
  disabled?: boolean;
}
```

**Verificar:** Botões renderizam no menu central

---

### Tarefa 11: Histórico Dropdown (na tela de jogo)

**Objetivo:** Dropdown que mostra as partidas anteriores da sessão, acessível pelo 📈 no menu

**Arquivos:**
- Criar: `src/components/HistoryDropdown.tsx`

**Funcionalidades:**
- Card branco sobreposto, centralizado
- Título "📈 Histórico" + opção "⏰ Partidas anteriores"
- Lista de partidas: "Time A vs Time B — 10x8" (mesmo estilo do GameOverScreen)
- Fechar com X ou backdrop

**Verificar:** Abre/fecha, mostra partidas corretas

---

### Tarefa 12: Adicionar ação SCORE_POINT_SUBTRACT no reducer

**Objetivo:** Suporte pra decrementar placar (swipe down ou undo)

**Arquivos:**
- Modificar: `src/context/AppContext.tsx`

```typescript
| { type: 'SCORE_POINT_SUBTRACT'; payload: { side: 'team1' | 'team2' } }
```

No reducer: decrementa a pontuação (mínimo 0). Não dispara fim de set/partida.

**Verificar:** Swipe down decrementa sem quebrar o jogo

---

### Tarefa 13: Adicionar ação UNDO_LAST_POINT no reducer

**Objetivo:** Desfazer o último ponto (↩ no menu)

**Arquivos:**
- Modificar: `src/context/AppContext.tsx`

Precisa de um `lastAction` no estado do game (ou history de scores) pra saber o que desfazer.

**Simplificação:** Manter `scoreHistory: [number, number][]` no GameSession — array de todos os estados de score já ocorridos. O ↩ simplesmente restaura o penúltimo estado.

```typescript
| { type: 'UNDO_LAST_POINT' }
```

**Verificar:** ↩ desfaz o último ponto corretamente

---

### Tarefa 14: Adicionar ação SWAP_SIDES no reducer

**Objetivo:** Inverter os lados dos times (⇄ no menu)

**Arquivos:**
- Modificar: `src/context/AppContext.tsx`

```typescript
| { type: 'SWAP_SIDES' }
```

No reducer: `scores = [scores[1], scores[0]]`, setScores1/setScores2 trocam, playing vira `[playing[1], playing[0]]`.

**Verificar:** ⇄ troca os lados visualmente e mantém pontuação consistente

---

### Tarefa 15: Atualizar CLOSE_GAME no reducer

**Objetivo:** Resetar todos os novos campos também

**Arquivos:**
- Modificar: `src/context/AppContext.tsx`

Adicionar no reset: `setScores1: [], setScores2: [], currentSet: 1`

---

### Tarefa 16: Atualizar GameOverScreen

**Objetivo:** Exibir histórico de sets quando setsEnabled, e manter compatibilidade

**Arquivos:**
- Modificar: `src/screens/GameOverScreen.tsx`

**Mudanças:**
- Mostrar detalhes dos sets em cada partida (ex: "Time A vs Time B — 3×1 (10×8, 8×10, 10×7)")
- Botão "Nova Partida" → reinicia jogo com mesmo config (sem voltar pro sorteio)
- Manter "Voltar ao início" e "Ver resultado do sorteio"

**Verificar:** GameOver mostra histórico, botões funcionam

---

### Tarefa 17: Efeitos decorativos (peões, mascotes)

**Objetivo:** Adicionar elementos decorativos na tela de jogo (da Tarefa 9), mas como sub-tarefa pra garantir que fiquem bonitos

**Arquivos:**
- Modificar: `src/screens/GameScreen.tsx`

**Mudanças:**
- Peões nos cantos (♟♝ ou ♛♚ — escolher os que ficam melhores)
- Mascotes: 🐸 à esquerda, 🐄 à direita
- Baixa opacidade: `opacity-[0.06]` a `opacity-[0.10]`

**Verificar:** Visual agradável, não atrapalha legibilidade

---

### Tarefa 18: Responsividade

**Objetivo:** Garantir que a tela de jogo funcione bem em mobile e desktop

**Arquivos:**
- Modificar: `src/screens/GameScreen.tsx`

**Pontos de atenção:**
- Placar deve ser legível em telas pequenas (usar `text-6xl sm:text-8xl lg:text-9xl`)
- Menu não deve sobrepor o placar em telas muito estreitas
- Nomes dos times truncados com ellipsis se muito longos
- Swipe down deve funcionar em mobile (touch events)

**Verificar:** Testar em viewport 375px (iPhone) e 1440px (desktop)

---

### Tarefa 19: Salvar config no localStorage

**Objetivo:** Persistir a última configuração de jogo entre sessões

**Arquivos:**
- Modificar: `src/lib/storage.ts`
- Modificar: `src/context/AppContext.tsx`

**Mudanças:**
- Salvar `gameConfig` no localStorage quando mudar
- Restaurar no mount do AppProvider

---

## Ordem de Implementação Sugerida

| # | Tarefa | Depends On |
|---|--------|-----------|
| 1 | Atualizar tipos | — |
| 2 | Adicionar emoji-picker | — |
| 3 | Atualizar estado inicial | 1 |
| 4 | Atualizar ResultScreen | 1 |
| 5 | Atualizar SCORE_POINT (sets) | 1, 3 |
| 6 | Atualizar END_MATCH | 1 |
| 7 | GameConfigModal | 1, 2 |
| 8 | ThemeModal | — |
| 9 | GameScreen redesign | 5, 7, 8 |
| 10 | MenuButton | 9 |
| 11 | HistoryDropdown | — |
| 12 | SCORE_POINT_SUBTRACT | 1 |
| 13 | UNDO_LAST_POINT | 1 |
| 14 | SWAP_SIDES | 1 |
| 15 | CLOSE_GAME update | 1 |
| 16 | GameOverScreen update | 5 |
| 17 | Decorativos | 9 |
| 18 | Responsividade | 9 |
| 19 | localStorage | 3 |

---

## Próximos Passos

1. Revisar este plano com o José
2. Se aprovado, implementar tarefa por tarefa usando subagents
3. Deploy na Vercel após cada grupo de tarefas
4. Testar manualmente no celular (touch/swipe)
