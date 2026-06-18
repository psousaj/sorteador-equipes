# Meu Racha 🏟️ — Contexto do Projeto

Sorteio de equipes para rachas, peladas e eventos esportivos.

## Stack

- **Frontend:** Astro 6 + React 19 + Tailwind v4
- **Lint/Format:** ESLint + Prettier
- **Deploy:** Vercel (auto-deploy via git)
- **Test:** Vitest

## Comandos

```bash
pnpm dev        # astro dev
pnpm build      # astro build
pnpm test       # vitest run
pnpm lint       # eslint .
pnpm preview    # astro preview
```

## Ambiente

- **Node:** 22+
- **pnpm:** 11.x
- **GitHub:** psousaj/meu-racha

## 🚨 Regra Sagrada: NUNCA push direto na main

NUNCA dar push direto na main. Sempre criar PR → revisar → mergear. Push direto na main só com ordem EXPLÍCITA do usuário.

## 🔄 Pós-PR Merge: sempre rodar `git sync-branch`

Após mergear QUALQUER PR na main, rodar:
```
git sync-branch
```

O alias global (`~/.gitconfig`) executa:
1. `git switch main`
2. `git pull --rebase`
3. `git switch development`
4. `git rebase main`
5. `git push --force-with-lease origin development`

Isso mantém a `development` sempre em cima da main. Se pular, commits divergem e o próximo PR tem conflitos.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (psousaj/meu-racha). Use `mcp_github_*` tools or `gh` CLI for all operations. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
