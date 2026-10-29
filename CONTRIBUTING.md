# Como contribuir

## Branches (Gitflow)

| Branch | Origem | Destino | Uso |
| --- | --- | --- | --- |
| `main` | — | — | Produção. Recebe apenas `release/*` e `hotfix/*`, sempre com tag. |
| `develop` | `main` | — | Integração contínua. |
| `feature/<nome>` | `develop` | `develop` | Funcionalidades e melhorias. |
| `release/<versao>` | `develop` | `main` | Preparação de versão. |
| `hotfix/<nome>` | `main` | `main` e `develop` | Correção urgente em produção. |

```bash
git switch develop
git switch -c feature/filtro-por-ambiente
# ... commits ...
git switch develop
git merge --no-ff feature/filtro-por-ambiente
```

## Commits (Gitmoji)

Formato: `<emoji> <tipo>: <descrição no imperativo, em português>`.

| Emoji | Tipo | Uso |
| --- | --- | --- |
| ✨ | `feat` | Nova funcionalidade |
| 🐛 | `fix` | Correção de bug |
| ♻️ | `refactor` | Refatoração sem mudar comportamento |
| 🎨 | `style` | Ajuste visual ou formatação |
| 📝 | `docs` | Documentação |
| ♿️ | `a11y` | Acessibilidade |
| ⚡️ | `perf` | Performance |
| 🔧 | `chore` | Configuração e manutenção |
| 🔀 | `merge` | Integração de branches |
| 🔖 | `release` | Versão/tag |

## Checklist antes do merge

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Teste visual em 390px e 1280px
- [ ] Nenhum dado real de cliente adicionado
- [ ] Commits no padrão Gitmoji
