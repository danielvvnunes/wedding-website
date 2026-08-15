# Template de email para mesas

Ficheiros:

- `mesa-casamento-classico.html`: versão HTML editorial, clássica e limpa, pronta para ferramentas de email.
- `mesa-casamento.txt`: versão texto simples para fallback.
- `../api/send-table-emails.js`: endpoint Resend para envio em lote a partir do painel admin.

Placeholders para substituir:

- `{{primeiro_nome}}`: primeiro nome do convidado.
- `{{mesa}}`: número, letra ou nome curto da mesa.
- `{{nome_mesa}}`: nome opcional da mesa. Se não usarem nomes de mesa, podem remover esta linha/bloco.
Sugestão de assunto:

`A tua mesa`

Sugestão de preheader:

`Quando chegar a hora de entrar na sala, esta é a tua mesa.`

## Envio com Resend

Configura estas variáveis no ambiente de produção:

- `RESEND_API_KEY`: API key do Resend.
- `RESEND_FROM_EMAIL`: remetente verificado no Resend, por exemplo `Francisca & Daniel <convite@franciscaedaniel.pt>`.
- `RESEND_REPLY_TO`: opcional; por defeito usa `casamento.franciscadaniel@gmail.com`.
- `VITE_ADMIN_PASSWORD`: a mesma password do painel admin. Em alternativa, podes usar `TABLE_EMAIL_ADMIN_PASSWORD` ou `ADMIN_PASSWORD` só para o endpoint.

No painel `/admin`, o botão `Testar emails` envia atualmente esta lista fixa:

```json
[
  {
    "email": "flutter@example.com",
    "firstName": "Flutter",
    "table": "7",
    "tableName": "Amigos"
  }
]
```

Também são aceites os nomes portugueses dos campos: `primeiro_nome`, `mesa` e `nome_mesa`.
