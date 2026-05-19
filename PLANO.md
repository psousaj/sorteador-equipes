# Sorteador de Equipes — Plano de Arquitetura

> **Versão:** 1.0  
> **Propósito:** Definir a estrutura modular do app, com 3 módulos independentes que podem ou não se conectar.

---

## 1. Filosofia: Módulos Independentes

O app é dividido em **3 módulos**. Cada um funciona **sozinho** ou **integrado**:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌──────────────┐   ┌──────────┐   ┌────────┐ │
│   │              │   │          │   │        │ │
│   │   SORTEIO    │◄──►   JOGO   │◄──► TORNEIO│ │
│   │              │   │          │   │        │ │
│   └──────────────┘   └──────────┘   └────────┘ │
│         ▲                  ▲              ▲      │
│         │                  │              │      │
│    USUÁRIO SÓ       SORTEIO +       TUDO +     │
│    QUER SORTEAR     QUER JOGAR     TORNEIO    │
│    E PRONTO         TAMBÉM         OPCIONAL   │
└─────────────────────────────────────────────────┘
```

### Regras:
- **Sorteio** não depende de nenhum outro módulo
- **Jogo** depende do Sorteio (precisa dos times), mas Sorteio não depende do Jogo
- **Torneio** depende do Sorteio, pode usar o Jogo, mas tem fluxo próprio
- Navegação entre módulos é feita por botões, nunca forçada

---

## 2. Módulo 1: Sorteio ✅ (PRONTO)

**Responsabilidade:** Gerenciar lista de pessoas, configurar times, sortear.

### Telas:
| Tela | Função |
|------|--------|
| **Home** | Adicionar pessoas, tags, bloquear pares, configurar time, regras de distribuição, capitão |
| **Animation** | Animação do sorteio (2s) |
| **Result** | Times sorteados + ações (copiar, compartilhar) |
| **History** | Sorteios anteriores |

### Conexões com outros módulos:
- **→ Jogo:** Botão "Iniciar Partida" na tela de Resultado
- **→ Torneio:** Botão "Criar Torneio" na tela de Resultado (futuro)

### Estado:
```typescript
// AppContext — já existe
{
  people: Person[],
  teamSize: number,
  rules: TeamRule[],
  enableCaptain: boolean,
  soundEnabled: boolean,
  drawError: string | null,
  currentResult: DrawResult | null,
  // ...
}
```

---

## 3. Módulo 2: Jogo 🎮 (PARCIAL)

**Responsabilidade:** Gerenciar partidas, placar, rodízio de times.

### Telas:
| Tela | Função |
|------|--------|
| **GameConfig** *(modal)* | Configurar regras da sessão: pontos, limite de vitórias, vantagem |
| **Game** | Placar horizontal, clicar no lado = ponto, fila de espera |
| **GameOver** | Resumo da sessão, histórico de partidas |

### Fluxo:
```
RESULTADO → [Configurar] → GAME → GAMEOVER → (volta)
             opcional           │               │
          (se não quiser,        │               │
           só fecha o modal)     │               │
                          [Encerrar         Histórico
                           partida]         da sessão
```

### Estado:
```typescript
// GameContext — novo, separado do AppContext
{
  isActive: boolean,
  config: {
    pointsToWin: number,  // 5, 10, 21...
    winLimit: number,     // 2 = "2 vitórias sai"
    deuce: boolean,       // vantagem de 2?
  },
  allTeams: Team[],
  queue: number[],         // IDs dos times esperando
  playing: [number, number] | null,  // times jogando agora
  scores: [number, number],
  wins: Record<number, number>,
  matchHistory: MatchResult[],
}
```

### Lógica de rodízio:
```
Time 1 vs Time 2  →  Time 2 ganha (1 vitória)
Time 1 vs Time 3  →  Time 1 ganha (1 vitória)
Time 3 vs Time 4  →  Time 3 ganha (1 vitória)
Time 4 vs Time 5  →  Time 4 ganha
...
Se winLimit = 2:
  Time 2 ganha de novo → 2 vitórias! Time 2 SAI
  Entram Time X vs Time Y
```

### Pontos de extensão:
- **Salvar partidas no histórico** (localStorage)
- **Estatísticas de jogadores** ao longo do tempo
- **Diferentes modos de jogo** (pontuação, tempo, rodadas)

---

## 4. Módulo 3: Torneio 🏆 (FUTURO)

**Responsabilidade:** Gerenciar chaveamento, fases, classificação.

### Telas (a definir):
| Tela | Função |
|------|--------|
| **TorneioConfig** | Tipo (eliminatória, grupos), número de times |
| **TorneioBracket** | Árvore de chaveamento visual |
| **TorneioTabela** | Fase de grupos, classificação |
| **TorneioFinal** | Partida final + 3º lugar |

### Relação com Módulo 2:
- **OPCIONAL:** cada partida do torneio PODE abrir o Módulo 2 (Jogo)
- **OU:** o torneio só registra vencedor, sem usar a tela de jogo
- Decisão: **configurável pelo usuário**

```
TORNEIO → Partida 1 → [Usar Jogo? Sim/Não] → Resultado
                                       ↓
                              Próxima partida...
```

---

## 5. Navegação Geral

```
                    ┌──────────┐
                    │   HOME   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ ANIMAÇÃO │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ RESULTADO│
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
         │ JOGO   │ │ TORNEIO│ │ HISTÓRICO│
         │ (Game) │ │ (futuro)│ │          │
         └───┬────┘ └────────┘ └──────────┘
             │
        ┌────▼────┐
        │GAME OVER│
        └────┬────┘
             │
        ┌────▼────┐
        │  HOME   │  (ou de onde veio)
        └─────────┘
```

---

## 6. Estrutura de Arquivos (alvo)

```
src/
├── types/
│   └── index.ts              ← tipos compartilhados
├── lib/
│   ├── sortAlgorithm.ts      ← algoritmo de sorteio
│   ├── storage.ts            ← localStorage
│   ├── sounds.ts             ← efeitos sonoros
│   └── genderInference.ts    ← inferência de gênero
├── context/
│   ├── AppContext.tsx         ← estado do Sorteio
│   ├── GameContext.tsx        ← estado do Jogo (★ extrair)
│   └── TournamentContext.tsx  ← estado do Torneio (futuro)
├── components/
│   ├── (componentes do Sorteio) PeopleInput, PeopleList, TeamConfig...
│   ├── (componentes do Jogo) ScoreBoard, TeamQueue, MatchHistory...
│   └── (componentes do Torneio) Bracket, GroupTable... (futuro)
├── screens/
│   ├── HomeScreen.tsx
│   ├── AnimationScreen.tsx
│   ├── ResultScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── GameScreen.tsx         ← ★ extrair GameContext
│   ├── GameOverScreen.tsx
│   ├── GameConfigScreen.tsx   ← ★ telona separada? ou modal?
│   ├── TournamentScreen.tsx   ← futuro
│   └── TournamentBracket.tsx  ← futuro
├── App.tsx
└── main.tsx
```

---

## 7. Próximos Passos (ordem sugerida)

| # | O que | Status |
|---|-------|--------|
| 1 | **Extrair GameContext** do AppContext | 🔜 |
| 2 | **Ajustar tela Game** conforme seu feedback | 🔜 |
| 3 | **Salvar partidas no localStorage** | 🔜 |
| 4 | **Tela de GameConfig como tela separada** (ou manter modal) | 🤔 |
| 5 | **Planejar Torneio** (só depois do Jogo estável) | 📅 |

---

## 8. Decisões Pendentes

- [ ] GameConfig: modal na ResultScreen ou tela separada?
- [ ] Salvar partidas: junto com histórico de sorteios ou separado?
- [ ] Deuce (vantagem de 2): implementar ou simplificar?
- [ ] Torneio: usar a tela de Jogo ou ter placar próprio?
- [ ] Tema visual: cores dos times (sempre azul/vermelho ou configurável?)
