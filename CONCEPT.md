# Eu não vou me diminuir por um padrão industrial

Autoria e direção: Brenno Leon de Souza Amaral | Nori Studios.

Um manifesto sobre a raiva de antecipar uma rejeição estética e apagar a própria expressão antes de mostrá-la. O alvo é a obrigação de obedecer a um padrão industrial. A composição precisa carregar o conflito que o texto descreve.

## Dramaturgia

1. **Contenção.** Letras pesadas e comprimidas cercam um vazio em movimento. Há vontade demais dentro de um espaço que parece regulado.
2. **Condicionamento.** Laocoonte preso pelas serpentes funciona como imagem da resistência de um corpo. A página de papel conserva a voz de um cartaz.
3. **Mutilação.** Ordens curtas da indústria interrompem o relato pessoal. O leitor pode riscá-las com o ponteiro.
4. **Vazio.** A escala do universo torna absurda a obrigação de existir pequeno. O texto desacelera.
5. **Recusa.** O shader faz a palavra OBEDEÇA perder a integridade e dar espaço a EXISTA conforme a leitura avança.
6. **Ruptura.** O visitante segura um comando enquanto a pressão cresce. O cartaz se abre, as linhas se rompem e a voz ocupa a composição. Enter oferece uma alternativa sem espera. Com movimento reduzido, um clique ativa o estado final.

## Referências musicais estudadas

Consulta em 2026-10-31. As músicas foram indicadas por Brenno como referências emocionais. Nenhuma gravação, melodia ou letra foi incorporada ao site. O áudio é síntese procedural original.

- **Cálice**, Chico Buarque e Gilberto Gil: a tensão entre uma voz que quer existir e a ordem que a bloqueia. Aplicação própria: contenção visual, repetição de ordens e tipografia sob pressão. [Letra consultada](https://www.cifraclub.com.br/gilberto-gil/calice/letra/). [Documento da censura de maio de 1973, Arquivo Nacional](https://www.gov.br/memoriasreveladas/pt-br/centrais-de-conteudo/multimidias/imagens-e-documentos-do-periodo-de-1964-1985/censura/letra-da-composicao-calice-de-gilberto-gil-e-chico-buarque-censurada-em-maio-de-1973), página atualizada em 2026-01-21.
- **Apesar de Você**, Chico Buarque, 1970: o ressentimento se transforma na perspectiva de que a autoridade não controlará o futuro para sempre. Aplicação própria: o clímax oferece recuperação da autoria, sem encerrar a obra apenas na dor. [Letra no acervo oficial](https://www.chicobuarque.com.br/obra/cancao/94). [Contexto na cronologia oficial](https://www.chicobuarque.com.br/vida?Decada=1970), sem data de atualização informada.

Essas aplicações são interpretação artística. O manifesto trata de conformismo estético no design; a repressão política da ditadura é o contexto histórico das canções, não uma equivalência proposta pela obra.

## Técnica e limites

Na segunda composição, o manifesto amplia a recusa com uma câmara de pressão presa ao scroll. A malha orbital se expande, as ordens perdem opacidade e o vermelho toma o campo. As palavras chegam por letras e deixam a tela em direções opostas. Uma parede interativa recebe carimbos do visitante. O áudio ganha médios e harmônicos para funcionar em caixas pequenas, com volume compartilhado por drone, textura e impactos. As setas e os controles passam a usar Lucide SVG.

- Shaders GLSL próprios, um draw call por cena, Bayer 4×4 e posterização em quatro tons.
- O campo do vazio combina disco de acreção, horizonte de eventos estilizado, domínio deformado e ruído fractal. É uma imagem expressiva, sem pretensão de simulação científica.
- O morfismo tipográfico mistura duas texturas de texto com deslocamento de coordenadas e máscara de ruído. O conteúdo essencial continua em HTML.
- CSS Animations e timelines de scroll com alternativa estática; Lenis React mantém os links de âncora.
- A cena só inicializa perto da área visível. Loops param fora de tela, com aba escondida ou movimento pausado. DPR limitado a 1.
- Sons começam desligados e só são sintetizados depois de uma ação explícita. Nenhum microfone, rastreador, armazenamento ou requisição de áudio.
- Fonte e imagem ficam no próprio site. Origem da escultura em `public/art/SOURCES.md`; licenças das fontes em `public/fonts/`.
