# Fonte do calendário

`decisions.json` é a fonte canónica das decisões e ações. `schema.json`
documenta o contrato em JSON Schema 2020-12 e o comando abaixo aplica também
as invariantes entre decisões:

```powershell
npm run calendar:validate
```

Executa sempre esta validação antes de fazer commit. Não guardar nomes da
criança, números de documentos, contactos pessoais ou outros dados familiares.

## Estrutura

Cada decisão tem todos estes campos:

```json
{
  "id": "visitar-exemplo",
  "title": "Visitar a creche Exemplo",
  "type": "visit",
  "owner": "human",
  "timing": { "kind": "date", "date": "2026-09-01" },
  "state": "planned",
  "remindersDays": [30, 14, 7, 2],
  "dependsOn": ["contactar-exemplo"],
  "issueNumber": 13,
  "source": {
    "label": "Calendário institucional",
    "url": "https://example.org/calendario",
    "checkedAt": "2026-07-30"
  },
  "notes": ""
}
```

### Tipos

- `research`: pesquisa documental executável por agentes;
- `review`: revisão humana dos dados recolhidos;
- `contact`: contacto humano;
- `visit`: visita humana;
- `application`: candidatura ou inscrição humana;
- `decision`: aceitação, rejeição ou escolha humana;
- `document`: preparação ou entrega de documentos;
- `payment`: pagamento;
- `adaptation`: período de adaptação;
- `renewal`: renovação;
- `closure`: encerramento ou pausa.

`contact`, `visit`, `application` e `decision` exigem sempre
`"owner": "human"`.

### Estados

- `unknown`: ainda sem data confirmada;
- `planned`: planeada;
- `completed`: concluída;
- `cancelled`: cancelada;
- `blocked`: bloqueada por uma dependência ou informação em falta.

## Formas de representar o tempo

### Data exata

```json
{
  "kind": "date",
  "date": "2026-09-01"
}
```

### Intervalo

Uma janela publicada não deve ser transformada num dia exato:

```json
{
  "kind": "range",
  "start": "2027-01-01",
  "end": "2027-04-30"
}
```

### Recorrência

As recorrências usam uma regra RRULE simples:

```json
{
  "kind": "recurrence",
  "start": "2027-01-15",
  "rrule": "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15"
}
```

### Data desconhecida

Uma data não publicada permanece desconhecida, não tem lembretes e usa estado
`unknown` ou `blocked`:

```json
{
  "timing": { "kind": "unknown" },
  "state": "unknown",
  "remindersDays": []
}
```

Entradas sem data aparecerão no futuro `calendario.md`, mas não serão emitidas
para `calendario.ics`.

## Fontes

Quando uma data é pública, regista a página original e a data da consulta:

```json
{
  "label": "Segurança Social — pedido de vaga",
  "url": "https://www.seg-social.pt/ptss/pssd/menu/ajuda/tutoriais/faq-acao-social-registo-pedido-vaga",
  "checkedAt": "2026-07-30"
}
```

Usa `null` quando ainda não existe fonte. Relatos comunitários podem orientar
pesquisa ou perguntas, mas não devem sustentar um prazo oficial.
