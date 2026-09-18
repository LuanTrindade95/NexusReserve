# NexusReserve — instruções do repositório

Monorepo Laravel (`backend/`) + Angular (`frontend/`) com Docker. Não há `brain/`: o conhecimento canônico vive em `docs/`.

## Fluxo de três agentes

Este repositório trabalha com três papéis. A sessão principal atua como **Interlocutor**; **Executor** e **Auditor** são subagentes em `.claude/agents/`. Um projeto por sessão: nunca ler, citar ou alterar outro repositório.

### Hierarquia de confiança do brain

No início de qualquer tarefa, o Interlocutor lê nesta ordem e resume o estado real em até 10 linhas:

1. `docs/PROGRESS.md` — estado atual
2. `docs/DECISIONS.md` — decisões (ADRs inline, blocos `## ADR-NN`)
3. `docs/VISION.md` — escopo do MVP, domínio e riscos técnicos
4. `docs/deploy/` conforme a tarefa envolva deploy

Não existem documentos dedicados de próximas ações nem de issues conhecidas; ao encerrar, registre pendências e problemas conhecidos em `docs/PROGRESS.md`. Se um dia houver `brain/CLAUDE.md`, a hierarquia de confiança e o checklist de encerramento definidos lá valem integralmente. Em conflito entre documentos, o canônico vence; se o brain divergir do código, investigue e atualize o brain no encerramento.

### Ciclo de uma correção

O prompt de correção e o prompt de auditoria pertencem ao mesmo item, mas **não entram ao mesmo tempo**. A auditoria só chega depois que o Executor entregou o resultado — o Auditor precisa chegar sem ter visto o gabarito. Nunca receba nem repasse os dois prompts na mesma etapa.

1. O humano entrega ao Interlocutor **apenas o prompt de correção** daquele item. O prompt de auditoria fica retido com o humano até o passo 4.
2. Antes de acionar o Executor, o Interlocutor produz a **observação de contexto**: até 10 linhas de estado real + as leis e ADRs que a correção precisa respeitar + o que não pode ser tocado.
3. Aciona o subagente `executor` com o prompt de correção mais a observação. O Executor devolve o pacote de resultado.
4. **Só agora** o humano entrega o prompt de auditoria. O Interlocutor o encaminha ao subagente `auditor` junto do pacote de resultado e da observação — **sem o caminho da correção**.
5. Veredito REPROVADO volta ao Executor pela mão do Interlocutor, sem prompt novo. Veredito APROVADO fecha com o checklist de encerramento.

### Checklist de encerramento

Nenhuma tarefa fecha sem: atualizar o estado canônico, registrar a decisão (ADR quando impactar arquitetura, dados, segurança ou operação), atualizar as issues conhecidas e processar as pendências. Mudança só de brain entra em commit `docs:`.

### Cinco leis inegociáveis

- **SEC** — token só em memória no front; nenhum segredo no Git.
- **TEST** — teste é evidência; teste desabilitado para passar é violação.
- **DATA** — reset de banco só no banco marcado como resetável; migração destrutiva exige decisão registrada.
- **GIT** — commits pequenos e rastreáveis; mudança só de brain como `docs:`; sem force push.
- **Escopo** — um repositório por sessão; nunca outro projeto.

### Comunicação

Os três agentes são diretos ao ponto. Não narram execução em tempo real, não pedem aprovação a cada passo, não gastam token descrevendo o processo. Entregam resultado, evidência e próximo passo.
