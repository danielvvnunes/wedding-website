# Emails dos convidados

`/admin/emails` tem duas campanhas, **Lembrete** e **Mesas**, geridas pelo mesmo painel e pelo mesmo serviço de servidor. A tabela `table_email_jobs` conserva o nome por compatibilidade; a coluna `kind` separa as campanhas. A unicidade por `(kind, email)` permite que um convidado receba ambos sem criar duplicados dentro de cada campanha. Os identificadores Resend são únicos em toda a tabela.

## Lembrete de 19 de setembro

O lembrete usa `src/lib/reminderEmail.js`, com saudação por grupo, singular/plural e ligação para `https://franciscaedaniel.pt`. Data: **19/09/2026, 19:04 Europe/Lisbon** (`18:04 UTC`). Inclui todas as pessoas com email e envia uma mensagem por endereço, sem depender das mesas.

Os 93 lembretes originalmente agendados pelo script local foram importados para o Supabase, conservando destinatários, conteúdo, data e identificadores Resend. A importação **não envia, não reagenda e não cancela**. O ficheiro `.email-campaigns.local/reminder-2026-09-19.json` mantém-se como cópia local, ignorada pelo Git, e tem a marca `centralizedAt`; o script antigo recusa `--schedule` após essa marca. A gestão passa a ser feita exclusivamente pelo admin.

Para importar novamente com segurança: `node scripts/import-reminder-campaign.mjs`. O script só permite pedidos à tabela Supabase, valida o registo, insere os identificadores em falta e nunca sobrepõe estados existentes. `node scripts/check-campaign-storage.mjs` verifica a integração local e o conteúdo guardado, sem executar ações de envio.

Os emails continuam agendados no Resend e não dependem de um computador ligado na data. O estado importado “Agendado” regista a aceitação original; só uma consulta posterior ao Resend preenche `last_checked_at`. A pré-visualização de mensagens guardadas lê o payload original, não volta a gerar o template a partir dos dados atuais dos convidados.

O painel `/admin/emails`, acessível a partir de `/admin`, usa as respostas reais de `rsvp.people`. Todos os registos com email são incluídos, mesmo quando a presença é `no`. Endereços são agrupados após remover espaços exteriores e converter para minúsculas. Cada endereço recebe **uma mensagem**, com o nome e a mesa de cada pessoa; pessoas do mesmo grupo podem ter mesas diferentes.

## Estado inicial

- Data por defeito: **26/09/2026 às 14:30 em Europe/Lisbon**, equivalente a `2026-09-26T13:30:00.000Z`.
- A data é editável e o rascunho fica neste navegador até preparar a campanha.
- Não se agenda nada ao abrir o painel, guardar mesas ou publicar código.
- Pessoas sem email são listadas à parte; nomes em falta e emails inválidos impedem preparar a campanha. Mesas em falta só impedem a campanha **Mesas**, nunca o lembrete.
- Nome, email, `table` e `tableName` são guardados no objeto original de cada pessoa em `rsvp.people`. Uma verificação da versão anterior evita sobrepor edições concorrentes.

## Configuração antes do primeiro agendamento

1. Aplicar `supabase/table_email_jobs.sql` no SQL Editor do projeto Supabase de produção. A tabela usa RLS e não permite acesso por `anon` ou `authenticated`.
2. Configurar `SUPABASE_SERVICE_ROLE_KEY` **apenas no servidor**, e `SUPABASE_URL` ou a `VITE_SUPABASE_URL` já existente. Nunca expor a service role numa variável `VITE_*`.
3. Manter `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (domínio verificado) e, opcionalmente, `RESEND_REPLY_TO` no servidor. Para atualizar estados e cancelar no admin, adicionar `RESEND_MANAGEMENT_API_KEY` com **Full access**; esta chave só é usada para consulta/cancelamento. Sem ela, o painel indica a limitação e mantém a consulta do conteúdo guardado disponível.
4. O endpoint aceita `TABLE_EMAIL_ADMIN_PASSWORD`, depois `ADMIN_PASSWORD`, depois `VITE_ADMIN_PASSWORD`, por compatibilidade com o admin existente. Se se configurar uma password específica, ela tem de corresponder à credencial enviada pelo painel. O login atual ainda usa `VITE_ADMIN_PASSWORD`; uma migração para autenticação de sessão de servidor é trabalho separado.
5. Confirmar a quota do Resend. No plano gratuito, o limite de 100 emails/dia também inclui testes e outros envios; não é validado automaticamente contra a conta.

Sem a configuração, o painel continua a permitir organizar mesas e rever as mensagens, mas o servidor recusa agendar. `npm run dev` executa os endpoints de emails através de middleware local do Vite, usando as variáveis de servidor de `.env.local`. Reiniciar o Vite após alterar essas variáveis. Um teste confirmado no painel local envia realmente pelo Resend; abrir a página ou pré-visualizar não envia nada. Em produção, os endpoints são funções Vercel e as credenciais de servidor também têm de ser configuradas nesse ambiente.

## Operação

1. Corrigir os avisos e preencher as mesas. Guardar alterações.
2. Abrir a pré-visualização de cada grupo. Opcionalmente, enviar uma cópia de teste **apenas** para o endereço indicado no campo de teste, após confirmação explícita. O teste usa o rascunho visível, mesmo sem guardar alterações ou preencher mesas (aparecem como “Por atribuir”). Requer nomes preenchidos, autenticação e configuração Resend no servidor; não depende da tabela de agendamentos nem da service role. Não guarda alterações nem agenda envios.
3. Escolher a data/hora de Lisboa e clicar em **Rever e agendar**. Confirmar o número de endereços e a data apresentada.
4. Manter o painel aberto até concluir a submissão. Cada mensagem fica primeiro registada numa outbox com conteúdo e data congelados; os pedidos de agendamento são sequenciais. Após aceitação pelo Resend, o envio futuro independe do navegador.
5. Se houver uma interrupção, usar **Retomar agendamento**. Não se repetem mensagens com um identificador do Resend já guardado. Pedidos ambíguos usam a mesma chave de idempotência e exatamente o mesmo conteúdo. Após 23 horas sem confirmação, a repetição é bloqueada: é necessário reconciliar o estado no Resend, pois as chaves expiram após 24h.
6. Para alterar a hora ou as mesas já preparadas, clicar em **Cancelar pendentes**, confirmar o cancelamento de todos e depois preparar uma nova versão. O histórico cancelado é conservado. Não se permite substituir uma mensagem já enviada.
7. Usar **Atualizar entregas** para consultar o estado no Resend. Não existe webhook nesta versão. “Entregue ao servidor” não significa lido nem garante a caixa principal.

Uma falha parcial mantém o progresso. “Parar após o email atual” interrompe a submissão local; **não cancela** emails já agendados. Uma tentativa sem identificador Resend precisa primeiro de ser retomada/reconciliada antes do cancelamento, para não esconder um envio possivelmente aceite.

## Código e verificação

- `src/lib/tableEmails.js`: agrupamento, validação, fuso horário e template HTML/texto partilhado pela pré-visualização e pelo envio.
- `src/TableEmailPanel.jsx`: painel comum às duas campanhas, com edição, revisão, teste, agendamento, cancelamento e estado.
- `api/table-email-campaign.js`: serviço comum, com isolamento por tipo de campanha, snapshots, idempotência e comunicação com Resend.
- `api/reminder-email-campaign.js`: configura o mesmo serviço para os lembretes.
- `api/send-table-emails.js`: alias do novo endpoint; a antiga submissão direta de uma lista livre deixou de ser aceite.
- `mesa-casamento-classico.html` e `mesa-casamento.txt`: referências visuais antigas; não são o template ativo.

Testes sem envios reais: `node --test tests/table-emails.test.mjs tests/table-email-api.test.mjs tests/reminder-email.test.mjs`.

Documentação: [agendamento](https://resend.com/docs/dashboard/emails/schedule-email), [idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys), [eventos](https://resend.com/docs/webhooks/event-types).
