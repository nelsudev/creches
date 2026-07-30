# Calendário de decisões — design

## Objetivo

Criar um calendário único para todas as decisões e ações necessárias até à entrada e permanência da criança numa creche. O calendário deve ser legível no GitHub, importável em aplicações pessoais e rastreável até às issues e fontes que sustentam cada data.

## Âmbito

O calendário cobre:

- revisão das 34 fichas;
- pesquisa de datas e documentos;
- contactos humanos;
- visitas;
- comparação e shortlist;
- seleção das opções permitidas na candidatura oficial;
- submissão e acompanhamento da candidatura;
- resposta a propostas e aceitação de vaga;
- entrega de documentos, pagamentos e adaptação;
- renovações;
- encerramentos, pausas e datas recorrentes.

Não cobre a execução automática de contactos, visitas, candidaturas, aceitações ou rejeições.

## Abordagem escolhida

Usar uma fonte de dados versionada no repositório para gerar:

1. `calendario.md`, orientado a leitura e revisão no GitHub;
2. `calendario.ics`, importável em Google Calendar, Outlook e aplicações móveis.

As GitHub Issues representam trabalho e evidência. Não são a fonte canónica do calendário, porque nem todas as decisões correspondem a uma issue e os calendários pessoais precisam de um formato interoperável.

## Modelo de decisão

Cada entrada contém:

- identificador estável;
- título;
- instituição ou âmbito global;
- zona;
- tipo: pesquisa, revisão, contacto, visita, candidatura, decisão, documento, pagamento, adaptação, renovação ou encerramento;
- responsável: agente ou humano;
- data, intervalo ou recorrência;
- fuso horário `Europe/Lisbon`;
- estado: desconhecido, planeado, concluído, cancelado ou bloqueado;
- antecedências de lembrete;
- dependências;
- issue relacionada;
- fonte e data da consulta;
- notas.

Uma data desconhecida permanece explicitamente desconhecida. O gerador nunca inventa uma data nem converte uma recomendação comunitária em prazo oficial.

## Fluxo

1. A pesquisa documental preenche datas oficiais publicadas.
2. Datas não publicadas originam perguntas nas fases humanas existentes.
3. O utilizador regista o resultado confirmado na fonte de dados.
4. O gerador atualiza Markdown e ICS de forma determinística.
5. A validação assinala datas vencidas, conflitos, dependências impossíveis, fontes antigas e ações sem responsável.
6. Uma rotina agendada pode abrir ou atualizar uma issue de alerta, mas nunca toma a decisão.

## Lembretes

Os valores padrão são 30, 14, 7 e 2 dias antes. Cada decisão pode substituí-los ou desativá-los. Eventos sem data não entram no ICS e aparecem numa secção própria de `calendario.md`.

## Segurança e limites humanos

- `fase:contactar`, `fase:visitar` e `fase:decidir` continuam exclusivamente humanas.
- O calendário pode lembrar uma candidatura ou aceitação, mas não a submete.
- A Action usa permissões mínimas e não recebe credenciais de serviços externos.
- Alterações geradas devem ser reproduzíveis e validadas em pull request ou push.

## Testes e critérios globais

- esquema e referências válidos;
- geração determinística de Markdown e ICS;
- datas no fuso correto;
- exclusão de datas desconhecidas do ICS;
- lembretes válidos e sem duplicados;
- cobertura das fases atuais e das 34 decisões de revisão;
- nenhuma fase humana executada automaticamente;
- documentação de importação e manutenção.

## Decomposição

Uma epic coordena seis entregas:

1. modelo de dados e esquema;
2. inventário inicial das decisões;
3. pesquisa de datas e janelas;
4. geradores Markdown e ICS;
5. validações e alertas;
6. lembretes, documentação e testes de utilização.
