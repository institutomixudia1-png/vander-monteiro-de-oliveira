export interface MatrizTCE {
  titulo: string;
  subtitulo: string;
  fundamentacao: string;
  clausulas: { id: string; titulo: string; texto: string }[];
  atribuicoesAgente: string;
}

export interface MatrizRescisao {
  titulo: string;
  subtitulo: string;
  comunicado: string;
  atividadesPadrao: string;
  textoAssinaturas: string;
}

export interface MatrizConvenio {
  clausula1_objeto: string;
  clausula1_paragrafo: string;
  clausula2_atribuicoesHunter: string[];
  clausula3_atribuicoesConcedente: string[];
  clausula4_valores: string;
  clausula5_vigencia: string;
  clausula6_responsabilidades: string;
  clausula6_paragrafo: string;
  clausula7_foro: string;
}

export interface MatrizRelatorioAtividades {
  titulo: string;
  subtitulo: string;
  fundamentacao: string;
  comunicado: string;
  cargoPadrao: string;
  atividadePadrao: string;
  horasSemanais: string;
  aspectosAvaliados: {
    letra: string;
    titulo: string;
    descricao: string;
  }[];
  consideracoesFinais: string;
}

export const STORAGE_KEY_MATRIZ_TCE = 'hunter_matriz_tce_v1';
export const STORAGE_KEY_MATRIZ_RESCISAO = 'hunter_matriz_rescisao_v1';
export const STORAGE_KEY_MATRIZ_CONVENIO = 'hunter_matriz_convenio_v1';
export const STORAGE_KEY_MATRIZ_RELATORIO = 'hunter_matriz_relatorio_v1';

export const DEFAULT_MATRIZ_TCE: MatrizTCE = {
  titulo: 'TCE - Termo de COMPROMISSO de ESTÁGIO',
  subtitulo: 'ACORDO DE COOPERAÇÃO PARA REALIZAÇÃO DE ESTÁGIO NÃO OBRIGATÓRIO',
  fundamentacao: '(Instrumentos jurídicos de que trata o inciso II do artigo 3º, da Lei 11.788, de 25/09/2008.) Celebram entre si o presente Instrumento jurídico de TERMO DE COMPROMISSO DE ESTÁGIO, previsto no Artigo 8º da Legislação do Estágio. Lei 11.788 de 25/09/2008.',
  clausulas: [
    {
      id: 'c1',
      titulo: 'Cláusula 1ª',
      texto: 'O presente TCE estabelece as condições básicas para a consecução do estágio NÃO OBRIGATÓRIO existente entre o(a) ESTAGIÁRIO(A) e a UNIDADE CONCEDENTE, caracterizando a não vinculação empregatícia, previsto nos Artigos 1º, 2º, 3º e 4º da Lei nº 11.788 de 25/09/2008.'
    },
    {
      id: 'c2',
      titulo: 'Cláusula 2ª',
      texto: 'O estágio obrigatório quanto o não-obrigatório, não cria vínculo empregatício de qualquer natureza, observadas as disposições previstas no Artigo 3º da Legislação do Estágio.'
    },
    {
      id: 'c3',
      titulo: 'Cláusula 3ª',
      texto: 'A Instituição de Ensino comunicará à parte concedente do estágio, através do Aluno, as datas de realização de avaliações escolares ou acadêmicas.'
    },
    {
      id: 'c4',
      titulo: 'Cláusula 4ª',
      texto: 'Se houver verificações de aprendizagem periódicas ou finais, no período de estágio do Estudante, a carga horária do estágio, nestas datas, poderá ser reduzida à metade.'
    },
    {
      id: 'c5',
      titulo: 'Cláusula 5ª',
      texto: 'O estagiário deverá apresentar em um prazo não superior a seis meses, o relatório das atividades do Estagiário, na conclusão ou na rescisão antecipada do Termo de Compromisso de Estágio.'
    },
    {
      id: 'c6',
      titulo: 'Cláusula 6ª',
      texto: 'O horário do estágio não deverá, em hipótese alguma, prejudicar a frequência do Aluno às aulas.'
    },
    {
      id: 'c7',
      titulo: 'Cláusula 7ª',
      texto: 'A assiduidade do Estagiário será demonstrada pela marcação de entrada e saída em cartão de ponto ou qualquer outra modalidade de controle adotada pela Parte Concedente.'
    },
    {
      id: 'c8',
      titulo: 'Cláusula 8ª',
      texto: 'O estágio, como ato educativo escolar supervisionado, deverá ter acompanhamento efetivo pelo professor orientador da Instituição de Ensino e por supervisor da Parte Concedente.'
    },
    {
      id: 'c9',
      titulo: 'Cláusula 9ª',
      texto: 'Ficam estabelecidas ainda entre as partes: O valor da bolsa-estágio descrito neste instrumento poderá variar em decorrência do não cumprimento das obrigações acordadas. Cabe a UNIDADE CONCEDENTE o fornecimento de auxílio transporte quando tratar-se de Estágio Não-Obrigatório. É assegurado ao estagiário período de recesso de 30 (trinta) dias a cada ano estagiado.'
    },
    {
      id: 'c10',
      titulo: 'Cláusula 10ª',
      texto: 'Caberá ao Estagiário informar à Parte Concedente alterações ocorridas na sua atividade escolar, como interrupção de frequência, mudança de curso ou transferência de Instituição de Ensino.'
    },
    {
      id: 'c11',
      titulo: 'Cláusula 11ª',
      texto: 'É de responsabilidade do Estagiário preservar o sigilo e a confidencialidade das informações a que tiver acesso no decorrer do seu estágio junto à Parte Concedente.'
    },
    {
      id: 'c12',
      titulo: 'Cláusula 12ª',
      texto: 'O não cumprimento de quaisquer das cláusulas previstas neste instrumento jurídico, abandono ou interrupção do curso, trancamento de matrícula, conduta não condizente ou comprovada insuficiência no desempenho do estágio, serão motivos de rescisão automática.'
    },
    {
      id: 'c13',
      titulo: 'Cláusula 13ª',
      texto: 'Aplica-se ao Estagiário a Legislação relacionada à saúde e segurança no trabalho, sendo sua implementação de responsabilidade da Parte concedente do Estágio.'
    },
    {
      id: 'c14',
      titulo: 'Cláusula 14ª',
      texto: 'O presente instrumento poderá ser renovado na forma da Lei e denunciado, a qualquer tempo, mediante comunicação escrita, pela Instituição de Ensino, pela Parte Concedente ou pelo Estagiário, não excedendo o limite de 2 anos.'
    },
    {
      id: 'c15',
      titulo: 'Cláusula 15ª',
      texto: 'A observância dos requisitos previstos no TCE e daqueles enumerados na Lei nº 11.788/2008 não configurarão sob hipótese alguma relação de emprego na forma do Artigo 3º da CLT.'
    },
    {
      id: 'c16',
      titulo: 'Cláusula 16ª',
      texto: 'Dos requisitos para segurança da informação e do disposto pela Lei nº 13.709/2018 (LGPD), referente à coleta, processamento, compartilhamento e eliminação das informações geradas através deste TCE para cumprir finalidades específicas de administração dos contratos.'
    }
  ],
  atribuicoesAgente: 'Atuar como auxiliar no processo de aperfeiçoamento do estágio identificando as oportunidades, ajustando suas condições de realização, fazendo o acompanhamento administrativo através de verificação in-loco e/ou através de relatórios, efetivar o Seguro Contra Acidentes Pessoais e cadastrar os estudantes (§1º do art. 5º da Lei nº 11.788/08).'
};

export const DEFAULT_MATRIZ_RESCISAO: MatrizRescisao = {
  titulo: 'Termo de Conclusão / Rescisão - TCE',
  subtitulo: 'Instrumento jurídico de Termo de Rescisão de Estágio e Convênio de Concessão de Estágio, previstos na Lei 11.788 de 25/01/2008 que regulamenta e disciplina a contratação de Estagiários.',
  comunicado: 'Comunicado de Conclusão / Rescisão do - TCE, termos e condições a seguir:',
  atividadesPadrao: 'ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE',
  textoAssinaturas: 'As partes, por estarem de acordo, assinam o presente termo de rescisão em vias de igual teor e forma para que surtam seus jurídicos e legais efeitos.'
};

export const DEFAULT_MATRIZ_CONVENIO: MatrizConvenio = {
  clausula1_objeto: 'Este convênio tem por objetivo o estabelecimento e a manutenção de um acordo de cooperação recíproca entre a UNIDADE CONCEDENTE e o AGENTE DE INTEGRAÇÃO visando o desenvolvimento de atividades conjuntas, capazes de propiciarem a plena operacionalização em conformidade com a Lei nº 11.788 de 25/09/2008 e demais normas aplicáveis relacionadas ao ESTÁGIO DE ESTUDANTES, de cunho obrigatório ou não, desenvolvido no ambiente de trabalho, que estejam freqüentando o ensino regular, em instituições de ensino superior, de educação profissional, de ensino médio, da educação especial e dos anos finais do ensino fundamental, na modalidade profissional da educação de jovens e adultos.',
  clausula1_paragrafo: 'Parágrafo Único: A HUNTER RECURSOS HUMANOS, tem o papel de auxiliar no processo de aperfeiçoamento do estágio identificando as oportunidades, ajustando suas condições de realização, fazendo o acompanhamento administrativo, através de verificação in loco e/ou através de relatórios, encaminhando negociação de seguros contra acidentes pessoais e cadastrando os estudantes (Parágrafo 1º do art. 5º da Lei nº 11.788 de 25/09//2008), selecionando os locais de estágio e organizando o cadastro das partes cedentes e das oportunidades de estágio. (art. 6º da Lei nº 11.788 de 25/09/2008).',
  clausula2_atribuicoesHunter: [
    'Relacionar-se com as INSTITUIÇÕES DE ENSINO e com elas celebrar convênios específicos, contendo as condições exigidas por essas para a caracterização e definição dos estágios de seus alunos;',
    'Repassar a UNIDADE CONCEDENTE as condições mencionadas na alínea (a) e definidas pelas INSTITUIÇÕES DE ENSINO;',
    'Obter da UNIDADE CONCEDENTE, a quantificação das oportunidades de ESTÁGIO possíveis de serem concedidas, com a identificação dos respectivos cursos;',
    'Encaminhar à UNIDADE CONCEDENTE, estudantes cadastrados pela HUNTER RECURSOS HUMANOS e identificados com as oportunidades de ESTÁGIO concedidas;',
    'Ajustar as condições de ESTÁGIO, definidas pelas INSTITUIÇÕES DE ENSINO com as condições e disponibilidades da UNIDADE CONCEDENTE;',
    'Providenciar para que a UNIDADE CONCEDENTE e o estudante assinem o respectivo TERMO DE COMPROMISSO DE ESTÁGIO, com a interveniência da INSTITUIÇÃO DE ENSINO;',
    'Preparar a documentação legal referente ao ESTÁGIO e repassar a UNIDADE CONCEDENTE os originais mediante termo de recebimento, bem como efetivar o respectivo seguro contra acidentes pessoais, em favor dos estudantes que realizarem ESTÁGIO junto a UNIDADE CONCEDENTE em decorrência deste Convênio;',
    'Poderá repassar ao estagiário mensalmente, a bolsa-auxílio, o auxílio transporte de acordo com o previsto no termo de compromisso de estágio a ser firmado.'
  ],
  clausula3_atribuicoesConcedente: [
    'Ofertar instalações que tenham condições de proporcionar ao estagiário, atividades de aprendizagem social, profissional e cultural, observando o estabelecido na legislação relacionada a saúde e segurança no trabalho conforme artigo 14 da Lei nº 11.788 de 25/09/2008;',
    'Indicar empregado do quadro pessoal, com formação ou experiência profissional na área do estágio, para orientar e supervisionar no máximo 10 (dez) estagiários simultaneamente;',
    'Receber os estudantes encaminhados pela HUNTER RECURSOS HUMANOS, mantendo com os mesmos, entendimentos sobre as condições de realização do ESTÁGIO;',
    'Repassar a HUNTER RECURSOS HUMANOS, o nome dos estudantes que, efetivamente, irão realizar o ESTÁGIO;',
    'Celebrar com os estudantes, os respectivos TERMOS DE COMPROMISSO DE ESTÁGIO, com a interveniência obrigatória das INSTITUIÇÕES DE ENSINO;',
    'Enviar a INSTITUIÇÃO DE ENSINO, com periodicidade mínima de 6(seis) meses, relatório de atividades, com vista obrigatória ao estagiário;',
    'A empresa se compromete a avisar no prazo de 3(três) dias a HUNTER RECURSOS HUMANOS, o desligamento do estagiário (desligado ou que pediu desligamento), para as devidas providências técnicas e administrativas;',
    'Informar, mensalmente, a HUNTER RECURSOS HUMANOS, a freqüência dos ESTAGIÁRIOS;',
    'Por ocasião do desligamento do ESTAGIÁRIO, entregar termo de realização de estágio, com indicação resumida das atividades, dos períodos e da avaliação de desempenho;',
    'Contratar, através do AGENTE DE INTEGRAÇÃO, seguro contra acidentes pessoais em favor do ESTAGIÁRIO;',
    'Guardar no estabelecimento o original dos documentos que comprovem a relação de ESTÁGIO após entrega desses pelo AGENTE DE INTEGRAÇÃO, responsabilizando-se pela guarda e conservação dos documentos.'
  ],
  clausula4_valores: 'A UNIDADE CONCEDENTE repassará diretamente a HUNTER RECURSOS HUMANOS, a taxa administrativa referente aos custos operacionais efetuados pelo AGENTE e contratação de seguro contra acidentes pessoais, para o encaminhamento e administração dos mesmos.',
  clausula5_vigencia: 'O presente Convênio terá a vigência por prazo indeterminado, podendo a qualquer tempo, ser rescindido por qualquer uma das partes, mediante comunicado por escrito, com antecedência mínima de 30 (trinta) dias.',
  clausula6_responsabilidades: 'A HUNTER RECURSOS HUMANOS se responsabiliza por quaisquer ações trabalhistas ou civis, oriundas de quaisquer estagiários sob sua administração constando a HUNTER RECURSOS HUMANOS como agente de integração em seu TCE, ESTANDO A PARTE CONCEDENTE EM CONFORMIDADE COM AS ORIENTAÇÕES TRANSMITIDAS PELA HUNTER RECURSOS HUMANOS À PARTE CONCEDENTE COM ASSINATURA DO MESMO.',
  clausula6_paragrafo: 'Parágrafo Único – Com a rescisão do presente Convênio, como conseqüência obrigatória e necessária ocorrerá o fim da relação de estágio intermediada pelo AGENTE DE INTEGRAÇÃO, independente do tempo de estágio transcorrido, cessando para o AGENTE DE INTEGRAÇÃO qualquer responsabilidade por eventual estágio posterior a data da rescisão do Convênio, inclusive em relação a seguro contra acidentes pessoais.',
  clausula7_foro: 'De comum acordo, os partícipes elegem o foro da Comarca de UBERABA a qualquer outro, por mais privileged que seja, para dirimir qualquer questão que se originar deste Convênio, e que não possa ser resolvida amigavelmente.'
};

export const getMatrizTCE = (): MatrizTCE => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MATRIZ_TCE);
    return saved ? JSON.parse(saved) : DEFAULT_MATRIZ_TCE;
  } catch {
    return DEFAULT_MATRIZ_TCE;
  }
};

export const getMatrizRescisao = (): MatrizRescisao => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MATRIZ_RESCISAO);
    return saved ? JSON.parse(saved) : DEFAULT_MATRIZ_RESCISAO;
  } catch {
    return DEFAULT_MATRIZ_RESCISAO;
  }
};

export const getMatrizConvenio = (): MatrizConvenio => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MATRIZ_CONVENIO);
    return saved ? JSON.parse(saved) : DEFAULT_MATRIZ_CONVENIO;
  } catch {
    return DEFAULT_MATRIZ_CONVENIO;
  }
};

export const DEFAULT_MATRIZ_RELATORIO: MatrizRelatorioAtividades = {
  titulo: 'RELATÓRIO de ATIVIDADES de ESTÁGIO',
  subtitulo: 'ACORDO DE COOPERAÇÃO PARA REALIZAÇÃO DE ESTÁGIO NÃO OBRIGATÓRIO',
  fundamentacao: '(Instrumentos jurídicos de que trata o inciso II do artigo 3º, da Lei 11.788, de 25/09/2008.)',
  comunicado: 'Celebram entre si o presente Instrumento jurídico de:\nRELATÓRIO DE ATIVIDADES DE ESTÁGIO, Previsto na Legislação do Estágio. Lei 11.788 de 25/09/2008.\nAs partes a seguir qualificadas,',
  cargoPadrao: 'DIRETOR(A) ADMINISTRATIVO(A)',
  atividadePadrao: 'ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE',
  horasSemanais: '30 horas semanais',
  aspectosAvaliados: [
    {
      letra: 'a',
      titulo: 'Assiduidade e pontualidade:',
      descricao: 'O(a) estagiário(a) demonstra assiduidade e pontualidade no cumprimento de sua jornada de estágio, observando os horários estabelecidos pela parte concedente.'
    },
    {
      letra: 'b',
      titulo: 'Responsabilidade e comprometimento:',
      descricao: 'Demonstra responsabilidade e comprometimento na realização das atividades que lhe são atribuídas, procurando cumprir as orientações recebidas.'
    },
    {
      letra: 'c',
      titulo: 'Proatividade:',
      descricao: 'Demonstra iniciativa na execução de suas atividades, buscando compreender as demandas e contribuir para o bom andamento das rotinas do setor.'
    },
    {
      letra: 'd',
      titulo: 'Trabalho em equipe:',
      descricao: 'Apresenta capacidade de trabalhar em equipe, mantendo relacionamento profissional e colaborativo com os demais integrantes do ambiente de estágio.'
    },
    {
      letra: 'e',
      titulo: 'Comunicação:',
      descricao: 'Demonstra comunicação adequada no ambiente profissional, transmitindo informações de maneira clara e respeitosa.'
    },
    {
      letra: 'f',
      titulo: 'Escuta ativa:',
      descricao: 'Demonstra capacidade de ouvir, compreender e aplicar as orientações, instruções e feedbacks recebidos durante o desenvolvimento das atividades.'
    },
    {
      letra: 'g',
      titulo: 'Relacionamento interpessoal:',
      descricao: 'Mantém relacionamento cordial e respeitoso com colegas, supervisores e demais pessoas com as quais mantém contato no ambiente de estágio.'
    },
    {
      letra: 'h',
      titulo: 'Organização:',
      descricao: 'Demonstra organização no desenvolvimento das atividades e no cumprimento das orientações e responsabilidades relacionadas ao estágio.'
    },
    {
      letra: 'i',
      titulo: 'Aprendizagem e desenvolvimento:',
      descricao: 'Demonstra interesse em aprender e desenvolver novos conhecimentos, procurando aplicar na prática as orientações recebidas e os conhecimentos relacionados à sua formação.'
    },
    {
      letra: 'j',
      titulo: 'Postura profissional:',
      descricao: 'Apresenta postura compatível com o ambiente profissional, respeitando as orientações recebidas e mantendo conduta adequada durante o período de estágio.'
    },
    {
      letra: 'k',
      titulo: 'Normas internas:',
      descricao: 'O(a) estagiário(a) segue as normas, procedimentos e orientações internas do setor no qual está inserido(a), as quais são devidamente repassadas e acompanhadas pelo(a) supervisor(a) do estágio.'
    },
    {
      letra: 'l',
      titulo: 'Compatibilidade das atividades:',
      descricao: 'As atividades desenvolvidas são realizadas sob orientação e acompanhamento do(a) supervisor(a) de estágio da parte concedente, mantendo relação com o processo de formação do(a) estagiário(a).'
    }
  ],
  consideracoesFinais: 'No período avaliado, o(a) estagiário(a) apresentou desenvolvimento compatível com as atividades propostas, participando das rotinas do ambiente profissional e recebendo acompanhamento e orientação do(a) supervisor(a) responsável.'
};

export const getMatrizRelatorio = (): MatrizRelatorioAtividades => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MATRIZ_RELATORIO);
    return saved ? JSON.parse(saved) : DEFAULT_MATRIZ_RELATORIO;
  } catch {
    return DEFAULT_MATRIZ_RELATORIO;
  }
};
