# Plano: Select único de regras (Tag + Gênero + futuros)

## Goal

Unificar o formulário de adicionar regra: **um único select** mostra todas as opções disponíveis (tags + gênero + o que vier no futuro). O `kind` da regra é deduzido automaticamente pelo valor selecionado, sem toggle manual.

## Current state

- `RulesSection` tem toggle **🏷️ Tag / ⚥ Gênero** com dois selects separados
- `newRuleKind`, `newRuleTag` e `newRuleGender` são 3 states separados
- `availableRuleTags` no HomeScreen **não** inclui opções de gênero (elas vêm do `GENDER_OPTIONS` dentro do RulesSection)
- O sortAlgorithm já trata `kind: 'gender'` corretamente

## Proposed approach

- `RulesSection`: **remove** o toggle Tag/Gênero e os states `newRuleKind`/`newRuleGender`
- `RulesSection`: **um único select** que recebe `availableRuleTags` (que agora inclui gênero)
- `HomeScreen`: `availableRuleTags` inclui as opções de gênero junto com as tags
- `RulesSection.handleAddRule`: deduz o `kind` a partir do valor selecionado:

```ts
const GENDER_VALUES = new Set(['male', 'female']);

// no handleAddRule:
const kind = GENDER_VALUES.has(newRuleTag) ? 'gender' : 'tag';
```

- A label visual da regra (no RuleRow) continua sendo definida por um lookup centralizado

## Files that change

| File | Change |
|------|--------|
| `src/screens/HomeScreen.tsx` | Adicionar `{ value: 'male', label: '♂ Homens' }` e `{ value: 'female', label: '♀ Mulheres' }` no `availableRuleTags` |
| `src/components/RulesSection.tsx` | Remover toggle, remover states `newRuleKind`/`newRuleGender`, usar `GENDER_VALUES` set pra deduzir `kind`, single select unificado |
| `src/types/index.ts` | Nenhuma mudança (TeamRule já tem `kind`) |
| `src/lib/sortAlgorithm.ts` | Nenhuma mudança (já trata `kind: 'gender'`) |

## Step-by-step

1. **HomeScreen** — adicionar gender no `availableRuleTags`:
   ```ts
   const availableRuleTags = useMemo(() => {
     return [
       { value: 'male', label: '♂ Homens' },
       { value: 'female', label: '♀ Mulheres' },
       ...DEFAULT_TAGS.map(t => ({ value: t.value, label: t.label })),
       ...allTags.map(t => ({ value: t, label: t })),
     ];
   }, [allTags]);
   ```

2. **RulesSection** — limpar (diff principal):
   - Remover `GENDER_OPTIONS` constante
   - Remover states `newRuleKind` e `newRuleGender`
   - Manter só `newRuleTag` (string) para o select único
   - Adicionar `GENDER_VALUES = new Set(['male', 'female'])`
   - No `handleAddRule`:
     ```ts
     const kind = GENDER_VALUES.has(newRuleTag) ? 'gender' : 'tag';
     ```
   - Remover todo o bloco do toggle (Tag/Gênero buttons)
   - Remover o `if/else` de selects (tag vs gender) — fica um select só
   - No disabled do botão: `disabled={!newRuleTag}` (checa se algo foi selecionado)
   - Reset: `setNewRuleTag('')` ao invés de múltiplos resets

3. **RuleRow** — verificar se a label de gênero ainda funciona corretamente (já tem o lookup por `rule.kind`)

4. **Testes e build**

## Labels e cores

- Regras de gênero exibidas no `RuleRow` com label `♂ Homens` / `♀ Mulheres` e cor `bg-gray-100 text-gray-600` (neutra, sem cor específica de tag)
- Tags `iniciante`/`experiente` mantêm suas cores (green/yellow)

## Extensibilidade futura

Para adicionar um novo tipo de filtro (ex: `skill_level: 'low' | 'mid' | 'high'`):
1. Adicionar as options no `availableRuleTags` com valores tipo `skill_low`, `skill_mid`, `skill_high`
2. Adicionar os valores ao `GENDER_VALUES`... ops, melhor criar um `FILTER_KINDS` mapper:

```ts
const FILTER_KIND: Record<string, 'tag' | 'gender'> = {
  male: 'gender',
  female: 'gender',
  // futuro -> skill_low: 'skill', etc.
};
```

Ou ainda mais simples: qualquer valor que existe no `availableRuleTags` mas **não** existe nos `DEFAULT_TAGS` e nem em `allTags` (tags das pessoas) → é um filtro especial. Mas isso é frágil. Melhor manter um mapa explícito.

## Verification

- `npm test` — 41 testes devem continuar passando
- `npm run build` — build limpo
- Visual: abrir o formulário de regras, ver que tem ♂ Homens / ♀ Mulheres no mesmo dropdown que Iniciante / Experiente
- Criar regra de gênero, ver se aparece no RuleRow
- Sortear com regra de gênero ativa
