# Creches

Repositório para levantamento e organização de informação sobre creches (e, quando possível, jardins de infância) em Portugal, com foco inicial em:

- Trofa
- Matosinhos
- Porto (zona de Ramalde)

Objetivo: reunir para cada creche o essencial para decidir e contactar — nome, morada/contactos, se é pública/rede solidária ou privada, se adere ao programa **Creche Feliz** (gratuitidade), se tem berçário, a faixa etária que cobre (idealmente dos 6 meses aos 6 anos) e se já a visitámos.

## Fontes fidedignas usadas

**Oficiais / primárias**
- [Carta Social](https://www.cartasocial.pt) — base de dados oficial (Ministério do Trabalho, Solidariedade e Segurança Social) de todas as respostas sociais licenciadas (creches, amas, jardins de infância da rede solidária). Pesquisa por distrito/concelho/freguesia; indica entidade, capacidade e tipo de resposta. Fonte principal para distinguir público/rede solidária vs. privada.
- [Segurança Social — Crianças e Jovens](https://www.seg-social.pt/criancas-e-jovens) e Segurança Social Direta — candidaturas a vagas de creche (online desde abril de 2026) e lista da bolsa de creches aderentes ao Creche Feliz.
- [Portal das Matrículas / DGEstE / DGE](https://www.dge.mec.pt) — rede pública de pré-escolar (3–6 anos), agrupamentos de escolas, matrícula e critérios de colocação.
- Comunicados do Governo sobre o Programa Creche Feliz — confirmação de gratuitidade (em vigor desde set. 2022 para o setor social, alargado a privados em 2023).

**Complementares / práticas**
- Câmaras Municipais (cm-trofa.pt, cm-matosinhos.pt, cm-porto.pt) — bolsas sociais municipais e respostas sociais locais.
- CNIS e uniões de IPSS/Misericórdias — diretórios de instituições solidárias.
- Google Maps / Google Reviews — contactos, horários e experiências reais de quem já lá esteve (não é fonte oficial).

**Nota:** oficialmente "creche" cobre 0–3 anos; dos 3 aos 6 anos passa a ser pré-escolar (rede pública DGE ou jardim de infância privado/solidário). Não existe uma instituição única que cubra 0–6 anos — é preciso cruzar Carta Social (0–3) com a rede de jardins de infância (3–6).

## Como se candidata a uma vaga (confirmado)

Desde **abril de 2026**, o pedido de vaga em creches **abrangidas** pelo Creche Feliz (rede solidária/IPSS, públicas, e privadas aderentes à bolsa) é feito **exclusivamente** pelo Portal Segurança Social Direta ou pela app da Segurança Social — já não há candidatura direta à instituição para a vaga em si. O processo:

1. Login na Segurança Social Direta (chave móvel digital ou NISS).
2. Menu Família → Desenvolvimento da Criança → Creche Feliz.
3. Pesquisar vagas por distrito/concelho/freguesia.
4. Selecionar até 3 creches por ordem de preferência e submeter.
5. Dentro da bolsa, a prioridade é para IPSS/rede solidária: só se pode usar uma creche **privada aderente** se não houver vaga numa IPSS da freguesia.

Isto substitui pedidos diretos à instituição para creches abrangidas pela bolsa (públicas, IPSS/solidárias, privadas aderentes). **Exceção:** creches **privadas que não aderem** ao Creche Feliz (fora da bolsa) continuam a ter inscrição direta com a própria instituição — para essas, confirmar sempre com a creche o processo de inscrição.

Fontes consultadas em 2026-07-30:
- [Creches gratuitas: quem tem direito e como fazer candidatura — DECO Proteste](https://www.deco.proteste.pt/familia-consumo/bebes-criancas/noticias/creches-gratuitas-quem-tem-direito-como-fazer-candidatura)
- [Programa Creche Feliz: como funciona, quem tem direito e como pedir — e-Konomista](https://www.e-konomista.pt/programa-creche-feliz/)
- [Rede de Creches Gratuitas — seg-social.pt](https://www.seg-social.pt/rede-de-creches-gratuitas)

## Como comparar preço entre redes

O preço de uma creche **não é comparável diretamente entre redes** sem saber qual mecanismo de cálculo se aplica. Ao preencher o campo "Preço" numa ficha, indicar sempre qual dos casos abaixo se aplica:

- **Creche Feliz (Grátis)** — se a criança nasceu a partir de 2021-09-01 e a creche está na bolsa aderente (pública, IPSS/solidária, ou privada aderente), a frequência é gratuita: inclui alimentação, atividades, seguro, inscrição e prolongamento. Registar como `Grátis — Creche Feliz`.
- **IPSS/rede solidária (fora do Creche Feliz, ou crianças nascidas antes de 2021-09-01)** — a mensalidade é uma **comparticipação familiar** calculada por escalões, não um valor fixo: aplica-se uma percentagem ao rendimento per capita do agregado (RC = rendimento líquido do agregado ÷ nº de membros), com a percentagem a subir por escalão à medida que o RC aumenta (referências encontradas variam entre ~14% no escalão mais baixo e podem ultrapassar 50% nos escalões mais altos, com um mínimo mensal definido e um máximo que cada instituição fixa no seu regulamento interno). **Os valores exatos por escalão variam por fonte e por regulamento interno de cada IPSS — não assumir uma tabela única; confirmar sempre com a instituição.**
- **Pública/municipal** — segue lógica semelhante de comparticipação por escalão de rendimento, gerida pelo município ou Segurança Social.
- **Privada (não aderente)** — mensalidade fixa definida pela própria instituição, sem relação com o rendimento; perguntar sempre o que está incluído (alimentação, prolongamento, seguro, matrícula) porque estes custos são frequentemente à parte.

Ao registar o preço numa ficha, escrever sempre a que caso corresponde (ex: `"€320/mês (comparticipação, escalão a confirmar)"` ou `"€280/mês fixo, + €15 seguro anual"`), não apenas um número solto.

Fontes consultadas em 2026-07-30:
- [Cálculo de mensalidade das IPSS — De Mãe para Mãe](https://demaeparamae.pt/forum/calculo-mensalidade-ipss-2)
- [Calculadora de Comparticipação IPSS — Skolvi](https://www.skolvi.com/pt/calculadora-creche)
- [Nota Rápida — Gratuitidade das Creches, planapp.gov.pt](https://www.planapp.gov.pt/wp-content/uploads/2023/02/NR_11_Creches_01FEV.pdf)

## Estado atual

Levantamento de fontes e regras concluído (issues #1, #2). Ainda sem dados de creches recolhidos — próximo passo é o levantamento por zona (Trofa, Matosinhos, Porto/Ramalde).
