export type LanguageCode = 'es' | 'en' | 'pt' | 'it' | 'fr';

export interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português-BR', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export const TRANSLATIONS = {
  es: {
    home: "Inicio",
    history: "Historia",
    about: "Quiénes somos",
    ministries: "Ministerios",
    pastor: "Pastor",
    events: "Eventos",
    gallery: "Galería",
    admin: "Cuentas",
    adminActive: "Admin Activo",
    exitAdmin: "Salir Administrador",
    panelAdmin: "Panel Administrador",
    // Prayer requests
    bibleTitle: "¿Podemos Orar por Ti?",
    prayerTitle: "Pedidos de Oración",
    prayerDesc: "Comparte con nosotros tus peticiones de oración. Nuestro equipo de intercesores y pastores estarán clamando al Señor por tu vida, tu familia y tus necesidades.",
    fullname: "Nombre Completo",
    fullnamePlaceholder: "Tu nombre",
    phone: "Teléfono (Opcional)",
    phonePlaceholder: "(000) 000-0000",
    email: "Correo Electrónico (Opcional)",
    emailPlaceholder: "tuemail@ejemplo.com",
    motif: "Motivo/Pedido de Oración",
    motifPlaceholder: "Escribe aquí tu petición o mensaje para oración...",
    sendRequest: "Enviar Motivo de Oración",
    submitting: "Transmitiendo clamor...",
    success: "¡Petición de oración enviada con éxito! Estaremos intercediendo por ti de inmediato.",
    error: "Por favor, rellene todos los campos obligatorios (*).",
    serverError: "Hubo un error al enviar su pedido. Inténtelo de nuevo.",
    // Common terms across headers
    knowUs: "Conócenos",
    viewCalendar: "Ver Calendario",
    sundayWorship: "Culto Dominical 10:00 AM",
    sundayServiceLive: "Servicio Dominical",
    announcements: "Avisos Especiales",
    lastMinute: "Comunicados Último Minuto",
    weeklyAgenda: "Agenda Semanal",
    ourServices: "Nuestros Cultos",
    locationContact: "Ubicación y Contacto",
    address: "DIRECCIÓN",
    phoneLabel: "TELÉFONO",
    meetingTimes: "Horarios de Reunión",
    facebookInvite: "Acompañe nuestro servicio dominical en Facebook Live. Comienza a las 11:15 de la mañana.",
    guestInvite: "¡Usted es nuestro invitado!",
    spiritualLeadership: "Liderazgo Espiritual",
    leadPastor: "Principal",
    weeklyMessage: "Mensaje Semanal",
    availableSocials: "Disponible en YouTube & Redes Sociales",
    viewSermons: "Ver Predicaciones",
    howToGetThere: "Cómo Llegar",
    upcomingActivities: "Próximas Actividades",
    specialEvents: "Eventos Especiales",
    sharedMemories: "Memorias Compartidas",
    momentsOfBlessing: "Momentos de Bendición",
    galleryDesc: "Un vistazo a la vibrante vida de nuestra iglesia a través de los años. Foto y video de nuestros encuentros más significativos.",
    galleryEmpty: "La galería está esperando nuevos recuerdos...",
    eventsEmpty: "No hay eventos programados en este momento...",
    servicesEmpty: "Nuestros horarios se están actualizando...",
    moreInfo: "Más info",
    album: "Álbum: ",
    aboutIdentity: "Identidad y Raíces",
    aboutDescHistory: "Un recorrido de fe inquebrantable que ha transformado generaciones en el corazón de Hartford.",
    aboutDescAbout: "Conoce nuestra visión, misión y los valores cristianos que guían cada paso de nuestra comunidad.",
    missionLabel: "Misión",
    visionLabel: "Visión",
    valuesLabel: "Valores",
    ministryHeaderBadge: "Servicio y Crecimiento",
    ministryHeaderDesc: "Hay un lugar diseñado por Dios para que Tú contribuyas. Descubre cómo puedes servir y ser edificado en nuestra gran familia."
  },
  en: {
    home: "Home",
    history: "History",
    about: "About Us",
    ministries: "Ministries",
    pastor: "Pastor",
    events: "Events",
    gallery: "Gallery",
    admin: "Accounts",
    adminActive: "Admin Active",
    exitAdmin: "Exit Admin",
    panelAdmin: "Admin Panel",
    bibleTitle: "Can We Pray For You?",
    prayerTitle: "Prayer Requests",
    prayerDesc: "Share your prayer requests with us. Our team of intercessors and pastors will be crying out to the Lord for your life, family, and needs.",
    fullname: "Full Name",
    fullnamePlaceholder: "Your name",
    phone: "Phone (Optional)",
    phonePlaceholder: "(000) 000-0000",
    email: "Email (Optional)",
    emailPlaceholder: "youremail@example.com",
    motif: "Reason/Prayer Request",
    motifPlaceholder: "Write your request or prayer message here...",
    sendRequest: "Send Prayer Request",
    submitting: "Transmitting prayer...",
    success: "Prayer request submitted successfully! We will be interceding for you immediately.",
    error: "Please fill in all required fields (*).",
    serverError: "There was an error submitting your request. Please try again.",
    knowUs: "About Us",
    viewCalendar: "See Calendar",
    sundayWorship: "Sunday Worship 10:00 AM",
    sundayServiceLive: "Sunday Service",
    announcements: "Special Announcements",
    lastMinute: "Last-Minute Announcements",
    weeklyAgenda: "Weekly Agenda",
    ourServices: "Our Services",
    locationContact: "Location & Contact",
    address: "ADDRESS",
    phoneLabel: "PHONE",
    meetingTimes: "Meeting Times",
    facebookInvite: "Join our Sunday worship on Facebook Live. Starts at 11:15 AM.",
    guestInvite: "You are our guest!",
    spiritualLeadership: "Spiritual Leadership",
    leadPastor: "Lead Pastor",
    weeklyMessage: "Weekly Message",
    availableSocials: "Available on YouTube & Social Networks",
    viewSermons: "Watch Sermons",
    howToGetThere: "Get Directions",
    upcomingActivities: "Upcoming Activities",
    specialEvents: "Special Events",
    sharedMemories: "Shared Memories",
    momentsOfBlessing: "Moments of Blessing",
    galleryDesc: "A glimpse into the vibrant life of our church through the years. Photos and videos of our most significant gatherings.",
    galleryEmpty: "The gallery is waiting for new memories...",
    eventsEmpty: "No events scheduled at this moment...",
    servicesEmpty: "Our schedules are being updated...",
    moreInfo: "More Info",
    album: "Album: ",
    aboutIdentity: "Identity & Roots",
    aboutDescHistory: "A journey of unwavering faith that has transformed generations in the heart of Hartford.",
    aboutDescAbout: "Discover our vision, mission, and the Christian values that guide every step of our community.",
    missionLabel: "Mission",
    visionLabel: "Vision",
    valuesLabel: "Values",
    ministryHeaderBadge: "Service & Growth",
    ministryHeaderDesc: "There is a place designed by God for you to contribute. Discover how you can serve and be edified in our big family."
  },
  pt: {
    home: "Início",
    history: "História",
    about: "Quem somos",
    ministries: "Ministérios",
    pastor: "Pastor",
    events: "Eventos",
    gallery: "Galeria",
    admin: "Contas",
    adminActive: "Admin Ativo",
    exitAdmin: "Sair Administrador",
    panelAdmin: "Painel Administrador",
    bibleTitle: "Podemos Orar por Você?",
    prayerTitle: "Pedidos de Oração",
    prayerDesc: "Compartilhe conosco seus pedidos de oração. Nossa equipe de intercessores e pastores estará clamando ao Senhor por sua vida, sua família e suas necessidades.",
    fullname: "Nome Completo",
    fullnamePlaceholder: "Seu nome",
    phone: "Telefone (Opcional)",
    phonePlaceholder: "(000) 000-0000",
    email: "E-mail (Opcional)",
    emailPlaceholder: "seuemail@exemplo.com",
    motif: "Motivo/Pedido de Oração",
    motifPlaceholder: "Escreva aqui sua petição ou mensagem de oração...",
    sendRequest: "Enviar Pedido de Oração",
    submitting: "Transmitindo clamor...",
    success: "Pedido de oração enviado com sucesso! Estaremos intercedendo por você imediatamente.",
    error: "Por favor, preencha todos os campos obrigatórios (*).",
    serverError: "Houve um erro ao enviar seu pedido. Tente novamente.",
    knowUs: "Quem Somos",
    viewCalendar: "Ver Calendário",
    sundayWorship: "Culto de Domingo 10h00",
    sundayServiceLive: "Culto de Domingo",
    announcements: "Avisos Especiais",
    lastMinute: "Comunicados de Última Hora",
    weeklyAgenda: "Agenda Semanal",
    ourServices: "Nossos Cultos",
    locationContact: "Localização e Contato",
    address: "ENDEREÇO",
    phoneLabel: "TELEFONE",
    meetingTimes: "Horários de Reunião",
    facebookInvite: "Acompanhe nosso culto de domingo no Facebook Live. Começa às 11h15.",
    guestInvite: "Você é nosso convidado!",
    spiritualLeadership: "Liderança Espiritual",
    leadPastor: "Pastor Principal",
    weeklyMessage: "Mensagem Semanal",
    availableSocials: "Disponível no YouTube e Redes Sociais",
    viewSermons: "Ver Pregações",
    howToGetThere: "Como Chegar",
    upcomingActivities: "Próximas Atividades",
    specialEvents: "Eventos Especiais",
    sharedMemories: "Memórias Compartilhadas",
    momentsOfBlessing: "Momentos de Bênção",
    galleryDesc: "Um vislumbre da vida vibrante de nossa igreja ao longo dos anos. Fotos e vídeos de nossos encontros mais significativos.",
    galleryEmpty: "A galeria está esperando por novas memórias...",
    eventsEmpty: "Não há eventos programados no momento...",
    servicesEmpty: "Nossos horários estão sendo atualizados...",
    moreInfo: "Mais Info",
    album: "Álbum: ",
    aboutIdentity: "Identidade e Raízes",
    aboutDescHistory: "Uma jornada de fé inabalável que transformou gerações no coração de Hartford.",
    aboutDescAbout: "Descubra nossa visão, missão e os valores cristãos que guiam cada passo da nossa comunidade.",
    missionLabel: "Missão",
    visionLabel: "Visão",
    valuesLabel: "Valores",
    ministryHeaderBadge: "Serviço e Crescimento",
    ministryHeaderDesc: "Há um lugar planejado por Deus para você contribuir. Descubra como você pode servir e ser edificado em nossa grande família."
  },
  it: {
    home: "Inizio",
    history: "Storia",
    about: "Chi siamo",
    ministries: "Ministeri",
    pastor: "Pastore",
    events: "Eventi",
    gallery: "Galleria",
    admin: "Conti",
    adminActive: "Admin Attivo",
    exitAdmin: "Esci Admin",
    panelAdmin: "Pannello Amministratore",
    bibleTitle: "Possiamo Pregare Per Te?",
    prayerTitle: "Richieste di Preghiera",
    prayerDesc: "Condividi con noi le tue richieste di preghiera. Il nostro team di intercessori e pastori griderà al Signore per la tua vita, la tua famiglia e i tuoi bisogni.",
    fullname: "Nome Completo",
    fullnamePlaceholder: "Il tuo nome",
    phone: "Telefono (Opzionale)",
    phonePlaceholder: "(000) 000-0000",
    email: "E-mail (Opzionale)",
    emailPlaceholder: "tuaimail@esempio.com",
    motif: "Motivo/Richiesta di Preghiera",
    motifPlaceholder: "Scrivi qui la tua richiesta o messaggio di preghiera...",
    sendRequest: "Invia Richiesta di Preghiera",
    submitting: "Trasmettendo la preghiera...",
    success: "Richiesta di preghiera inviata con successo! Intercederemo per te immediatamente.",
    error: "Si prega di compilare tutti i campi obbligatori (*).",
    serverError: "Si è verificato un errore durante l'invio della richiesta. Riprova.",
    knowUs: "Chi Siamo",
    viewCalendar: "Vedi Calendario",
    sundayWorship: "Culto Domenicale 10:00",
    sundayServiceLive: "Culto Domenicale",
    announcements: "Avvisi Speciali",
    lastMinute: "Comunicati Ultimo Minuto",
    weeklyAgenda: "Agenda Settimanale",
    ourServices: "I Nostri Culti",
    locationContact: "Ubicazione e Contatto",
    address: "DIREZIONE",
    phoneLabel: "TELEFONO",
    meetingTimes: "Orari di Riunione",
    facebookInvite: "Segui il nostro culto domenicale su Facebook Live. Inizia alle 11:15 del mattino.",
    guestInvite: "Sei il nostro ospite!",
    spiritualLeadership: "Guida Spirituale",
    leadPastor: "Pastore Principale",
    weeklyMessage: "Messaggio Settimanale",
    availableSocials: "Disponibile su YouTube e Social Network",
    viewSermons: "Vedi Sermoni",
    howToGetThere: "Come Arrivare",
    upcomingActivities: "Prossime Attività",
    specialEvents: "Eventi Speciali",
    sharedMemories: "Memorie Condivise",
    momentsOfBlessing: "Momenti di Benedizione",
    galleryDesc: "Uno sguardo alla vibrante vita della nostra chiesa nel corso degli anni. Foto e video dei nostri incontri più significativi.",
    galleryEmpty: "La galleria aspetta nuovi ricordi...",
    eventsEmpty: "Non ci sono eventi in programma al momento...",
    servicesEmpty: "I nostri orari si stanno aggiornando...",
    moreInfo: "Più Info",
    album: "Album: ",
    aboutIdentity: "Identità e Radici",
    aboutDescHistory: "Un viaggio di fede incrollabile che ha trasformato generazioni nel cuore di Hartford.",
    aboutDescAbout: "Scopri la nostra visione, missione e i valori cristiani che guidano ogni passo della nostra comunità.",
    missionLabel: "Missione",
    visionLabel: "Visione",
    valuesLabel: "Valori",
    ministryHeaderBadge: "Servizio e Crescita",
    ministryHeaderDesc: "C'è un posto disegnato da Dio in cui puoi contribuire. Scopri come puoi servire ed essere edificato nella nostra grande famiglia."
  },
  fr: {
    home: "Accueil",
    history: "Histoire",
    about: "Qui sommes-nous",
    ministries: "Ministères",
    pastor: "Pasteur",
    events: "Événements",
    gallery: "Galerie",
    admin: "Comptes",
    adminActive: "Admin Actif",
    exitAdmin: "Quitter l'Admin",
    panelAdmin: "Panneau de Configuration",
    bibleTitle: "Pouvons-nous Prier Pour Vous?",
    prayerTitle: "Requêtes de Prière",
    prayerDesc: "Partagez vos demandes de prière avec nous. Notre équipe d'intercesseurs et de pasteurs criera au Seigneur pour votre vie, votre famille et vos besoins.",
    fullname: "Nom Complet",
    fullnamePlaceholder: "Votre nom",
    phone: "Téléphone (Optionnel)",
    phonePlaceholder: "(000) 000-0000",
    email: "Adresse e-mail (Optionnel)",
    emailPlaceholder: "votremail@exemple.com",
    motif: "Motif/Demande de Prière",
    motifPlaceholder: "Écrivez ici votre demande ou message de prière...",
    sendRequest: "Envoyer la Demande de Prière",
    submitting: "Transmission de la prière...",
    success: "Demande de prière envoyée avec succès! Nous intercéderons pour vous immédiatement.",
    error: "Veuillez remplir tous les champs obligatoires (*).",
    serverError: "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.",
    knowUs: "Découvrez-nous",
    viewCalendar: "Voir l'agenda",
    sundayWorship: "Culte du Dimanche 10h00",
    sundayServiceLive: "Service du Dimanche",
    announcements: "Annonces Spéciales",
    lastMinute: "Annonces de Dernière Minute",
    weeklyAgenda: "Agenda Hebdomadaire",
    ourServices: "Nos Cultes",
    locationContact: "Adresse et Contact",
    address: "ADRESSE",
    phoneLabel: "TÉLÉPHONE",
    meetingTimes: "Horaires des Réunions",
    facebookInvite: "Suivez notre culte du dimanche sur Facebook Live. Commence à 11h15 du matin.",
    guestInvite: "Vous êtes notre invité !",
    spiritualLeadership: "Leadership Spirituel",
    leadPastor: "Pasteur Principal",
    weeklyMessage: "Message Hebdomadaire",
    availableSocials: "Disponible sur YouTube et Réseaux Sociaux",
    viewSermons: "Voir les Prédications",
    howToGetThere: "Comment s'y Rendre",
    upcomingActivities: "Activités à Venir",
    specialEvents: "Événements Spéciaux",
    sharedMemories: "Souvenirs Partagés",
    momentsOfBlessing: "Moments de Bénédiction",
    galleryDesc: "Un aperçu de la vie vibrante de notre église au fil des ans. Photos et vidéos de nos rencontres les plus significatives.",
    galleryEmpty: "La galerie attend de nouveaux souvenirs...",
    eventsEmpty: "Aucun événement programmé pour le moment...",
    servicesEmpty: "Nos horaires sont en cours de mise à jour...",
    moreInfo: "Plus d'infos",
    album: "Album : ",
    aboutIdentity: "Identité et Racines",
    aboutDescHistory: "Un cheminement de foi inébranlable qui a transformé des générations au cœur de Hartford.",
    aboutDescAbout: "Découvrez notre vision, notre mission et les valeurs chrétiennes qui guident chaque étape de notre communauté.",
    missionLabel: "Mission",
    visionLabel: "Vision",
    valuesLabel: "Valeurs",
    ministryHeaderBadge: "Service et Croissance",
    ministryHeaderDesc: "Il y a une place conçue par Dieu pour que vous y contribuiez. Découvrez comment vous pouvez servir et être édifié au sein de notre grande famille."
  }
};

/**
 * On-the-fly dictionary mapping of specific Spanish phrases to selected target languages.
 * This guarantees the dynamic database seeded strings (or settings defaults) are instantly translated.
 */
const TEXT_PHRASE_DICTIONARY: Record<string, Record<LanguageCode, string>> = {
  // Church Name
  "Iglesia Bautista Emanuel Hartford": {
    es: "Iglesia Bautista Emanuel Hartford",
    en: "Emanuel Baptist Church Hartford",
    pt: "Igreja Batista Emanuel Hartford",
    it: "Chiesa Battista Emanuel Hartford",
    fr: "Église Baptiste Emanuel Hartford"
  },
  "Iglesia Bautista Emanuel": {
    es: "Iglesia Bautista Emanuel",
    en: "Emanuel Baptist Church",
    pt: "Igreja Batista Emanuel",
    it: "Chiesa Battista Emanuel",
    fr: "Église Baptiste Emanuel"
  },
  // Mission
  "Exaltar el nombre de Jesucristo y extender Su Reino a través de la predicación del evangelio a todas las naciones y el discipulado integral.": {
    es: "Exaltar el nombre de Jesucristo y extender Su Reino a través de la predicación del evangelio a todas las naciones y el discipulado integral.",
    en: "Exalt the name of Jesus Christ and extend His Kingdom through preaching the gospel to all nations and comprehensive discipleship.",
    pt: "Exaltar o nome de Jesus Cristo e estender Seu Reino através da pregação do evangelho a todas as nações e do discipulado integral.",
    it: "Esaltare il nome di Gesù Cristo ed estendere il Suo Regno attraverso la predicazione del vangelo a tutte le nazioni e il discepolato integrale.",
    fr: "Exalter le nom de Jésus-Christ et étendre Son Royaume par la prédication de l'Évangile à toutes les nations et un discipulat intégral."
  },
  // Vision
  "Ser una comunidad vibrante y transformadora que impacte Hartford con el poder del Espíritu Santo, restaurando vidas y familias.": {
    es: "Ser una comunidad vibrante y transformadora que impacte Hartford con el poder del Espíritu Santo, restaurando vidas y familias.",
    en: "To be a vibrant and transformative community that impacts Hartford with the power of the Holy Spirit, restoring lives and families.",
    pt: "Ser uma comunidade vibrante e transformadora que impacte Hartford com o poder do Espírito Santo, restaurando vidas e famílias.",
    it: "Essere una comunità vibrante e trasformatrice che colpisca Hartford con la potenza dello Spirito Santo, restaurando vite e famiglie.",
    fr: "Être une communauté vibrante et transformatrice qui impacte Hartford par la puissance du Saint-Esprit, restaurant les vies et les familles."
  },
  // Values labels
  "Fe Bíblica": {
    es: "Fe Bíblica",
    en: "Biblical Faith",
    pt: "Fé Bíblica",
    it: "Fede Biblica",
    fr: "Foi Biblique"
  },
  "Amor Fraternal": {
    es: "Amor Fraternal",
    en: "Fraternal Love",
    pt: "Amor Fraternal",
    it: "Amore Fraterno",
    fr: "Amour Fraternel"
  },
  "Excelencia en el Servicio": {
    es: "Excelencia en el Servicio",
    en: "Excellence in Service",
    pt: "Excelência no Serviço",
    it: "Eccellenza nel Servizio",
    fr: "Excellence dans le Service"
  },
  // History steps
  "Semilla de Fe": {
    es: "Semilla de Fe",
    en: "Seed of Faith",
    pt: "Semente de Fé",
    it: "Seme di Fede",
    fr: "Graine de Foi"
  },
  "Nuestra iglesia nació de un pequeño grupo de oración en un hogar familiar, impulsado por un hambre inmensa de la presencia de Dios.": {
    es: "Nuestra iglesia nació de un pequeño grupo de oración en un hogar familiar, impulsado por un hambre inmensa de la presencia de Dios.",
    en: "Our church was born from a small prayer group in a family home, driven by an immense hunger for the presence of God.",
    pt: "Nossa igreja nasceu de um pequeno grupo de oração em um lar familiar, impulsionado por uma imensa fome pela presença de Deus.",
    it: "La nostra chiesa è nata da un piccolo gruppo di preghiera in una casa di famiglia, spinta da un'immensa fame della presenza di Dio.",
    fr: "Notre église est née d'un petit groupe de prière dans une maison familiale, animé par une faim immense de la présence de Dieu."
  },
  "Fundamentos Sólidos": {
    es: "Fundamentos Sólidos",
    en: "Solid Foundations",
    pt: "Fundamentos Sólidos",
    it: "Fondamenta Solide",
    fr: "Fondements Solides"
  },
  "Después de años de perseverancia, establecimos nuestra primera sede propia, convirtiéndonos en un punto de referencia espiritual para la ciudad.": {
    es: "Después de años de perseverancia, establecimos nuestra primera sede propia, convirtiéndonos en un punto de referencia espiritual para la ciudad.",
    en: "After years of perseverance, we established our first home base, becoming a spiritual reference point for the city.",
    pt: "Após anos de perseverança, estabelecemos nossa primeira sede própria, tornando-nos um ponto de referência espiritual para a cidade.",
    it: "Dopo anni di perseveranza, abbiamo stabilito la nostra prima sede, diventando un punto di riferimento spirituale per la città.",
    fr: "Après des années de persévérance, nous avons établi notre premier siège, devenant ainsi un point de référence spirituel pour la ville."
  },
  "Nueva Generación": {
    es: "Nueva Generación",
    en: "New Generation",
    pt: "Nova Geração",
    it: "Nuova Generazione",
    fr: "Nouvelle Génération"
  },
  "Lanzamos ministerios enfocados en la juventud con el objetivo de equipar a los líderes del mañana bajo los principios bíblicos.": {
    es: "Lanzamos ministerios enfocados en la juventud con el objetivo de equipar a los líderes del mañana bajo los principios bíblicos.",
    en: "We launched youth-focused ministries with the aim of equipping tomorrow's leaders under biblical principles.",
    pt: "Lançamos ministérios focados na juventude com o objetivo de equipar os líderes de amanhã sob os princípios bíblicos.",
    it: "Abbiamo avviato ministeri incentrati sui giovani con l'obiettivo di equipaggiare i leader di domani secondo i principi biblici.",
    fr: "Nous avons lancé des ministères axés sur la jeunesse dans le but d'équiper les leaders de demain selon les principes bibliques."
  },
  "Luz Continua": {
    es: "Luz Continua",
    en: "Continuous Light",
    pt: "Luz Contínua",
    it: "Luce Continua",
    fr: "Lumière Continue"
  },
  "Seguimos creciendo y sirviendo a Hartford, extendiendo el amor de Cristo a través de misiones locales y mundiales.": {
    es: "Seguimos creciendo y sirviendo a Hartford, extendiendo el amor de Cristo a través de misiones locales y mundiales.",
    en: "We continue to grow and serve Hartford, spreading the love of Christ through local and global misiones.",
    pt: "Continuamos crescendo e servindo a Hartford, espalhando o amor de Cristo através de missões locais e globais.",
    it: "Continuiamo a crescere e servire Hartford, diffondendo l'amore di Cristo attraverso missioni locali e mondiali.",
    fr: "Nous continuons à grandir et à servir Hartford, en répandant l'amour du Christ à travers des missions locales et mondiales."
  },
  // Pastor values
  "Nuestra verdadera pasión es ver vidas transformadas radicalmente por el poder restaurador del Evangelio. En Emanuel no solo encontrarás una congregación, sino un hogar donde crecemos juntos en el amor de Cristo.": {
    es: "Nuestra verdadera pasión es ver vidas transformadas radicalmente por el poder restaurador del Evangelio. En Emanuel no solo encontrarás una congregación, sino un hogar donde crecemos juntos en el amor de Cristo.",
    en: "Our true passion is to see lives radically transformed by the restoring power of the Gospel. At Emanuel, you will not only find a congregation, but a home where we grow together in Christ's love.",
    pt: "Nossa verdadeira paixão é ver vidas radicalmente transformadas pelo poder restaurador do Evangelho. Na Emanuel você não encontrará apenas uma congregação, mas um lar onde crescemos juntos no amor de Cristo.",
    it: "La nostra vera passione è vedere vite radicalmente trasformate dal potere restauratore del Vangelo. In Emanuel non troverai solo una congregazione, ma una casa dove cresciamo insieme nell'amore di Cristo.",
    fr: "Notre véritable passion est de voir des vies radicalement transformées par la puissance restauratrice de l'Évangile. À Emanuel, vous ne trouverez pas seulement une assemblée, mais un foyer où nous grandissons ensemble dans l'amour du Christ."
  },
  "El Reverendo Juan Carlos Pérez ha dedicado más de tres décadas al servicio del Reino de Dios, enfocándose en la enseñanza profunda de las Escrituras y el cuidado pastoral.\n\nSu ministerio se caracteriza por un compromiso inquebrantable con la Gran Comisión y la formación de discípulos que impacten positivamente su entorno. En Hartford, ha liderado durante diez años una visión de crecimiento espiritual genuino y alcance comunitario, creyendo firmemente que cada persona tiene un propósito divino esperando ser activado en el cuerpo de Cristo.": {
    es: "El Reverendo Juan Carlos Pérez ha dedicado más de tres décadas al servicio del Reino de Dios, enfocándose en la enseñanza profunda de las Escrituras y el cuidado pastoral.\n\nSu ministerio se caracteriza por un compromiso inquebrantable con la Gran Comisión y la formación de discípulos que impacten positivamente su entorno. En Hartford, ha liderado durante diez años una visión de crecimiento espiritual genuino y alcance comunitario, creyendo firmemente que cada persona tiene un propósito divino esperando ser activado en el cuerpo de Cristo.",
    en: "Reverend Juan Carlos Pérez has dedicated over three decades to serving the Kingdom of God, focusing on deep Scriptural teaching and pastoral care.\n\nHis ministry is characterized by an unwavering commitment to the Great Commission and the training of disciples who positively impact their environment. In Hartford, he has led for ten years a vision of genuine spiritual growth and community outreach, firmly believing that every person has a divine purpose waiting to be activated in the body of Christ.",
    pt: "O Reverendo Juan Carlos Pérez dedicou mais de três décadas a serviço do Reino de Deus, concentrando-se no ensino bíblico profundo e no cuidado pastoral.\n\nSeu ministério é marcado por um compromisso inabalável com a Grande Comissão e com a formação de discípulos que impactem positivamente seu ambiente. Em Hartford, ele lidera há dez anos uma visão de crescimento espiritual genuíno e alcance comunitário, acreditando firmemente que cada pessoa tem um propósito divino esperando para ser ativado no corpo de Cristo.",
    it: "Il pastore Juan Carlos Pérez ha dedicato più di tre decenni al servizio del Regno di Dio, concentrandosi sull'insegnamento profondo delle Scritture e sulla cura pastorale.\n\nIl suo ministero si caratterizza per un impegno incrollabile verso il Grande Mandato e per la formazione di discepoli che abbiano un impatto positivo sul loro territorio. A Hartford, ha guidato per dieci anni una visione di crescita spirituale genuina e di servizio alla comunità, credendo fermamente che ogni persona abbia un proposito divino in attesa di essere attivato nel corpo di Cristo.",
    fr: "Le révérend Juan Carlos Pérez consacre plus de trois décennies au service du Royaume de Dieu, en se concentrant sur l'enseignement approfondi des Écritures et les soins pastoraux.\n\nSon ministère se caractérise par un engagement inébranlable envers la Grande Commission et la formation de disciples qui impactent positivement leur environnement. À Hartford, il mène depuis dix ans une vision de croissance spirituelle authentique et de sensibilisation communautaire, croyant fermement que chacun a un but divin qui attend d'être activé dans le corps du Christ."
  },
  // Welcome Msg
  "Qué alegría que estés aquí. Gracias por visitar nuestra casa online. Oramos para que este espacio sea de gran bendición y edificación para tu vida.": {
    es: "Qué alegría que estés aquí. Gracias por visitar nuestra casa online. Oramos para que este espacio sea de gran bendición y edificación para tu vida.",
    en: "What a joy that you are here. Thank you for visiting our online home. We pray that this space will be of great blessing and edification for your life.",
    pt: "Que alegria você estar aqui. Obrigado por visitar nossa casa online. Oramos para que este espaço seja de grande bênção e edificação para sua vida.",
    it: "Che gioia che tu sia qui. Grazie per aver visitato la nostra casa online. Preghiamo affinché questo spazio sia di grande benedizione ed edificazione per la tua vita.",
    fr: "Quel bonheur que vous soyez là. Merci de visiter notre maison en ligne. Nous prions pour que cet espace soit une grande bénédiction et édification pour votre vie."
  },
  "¡Bienvenidos!": {
    es: "¡Bienvenidos!",
    en: "Welcome!",
    pt: "Bem-vindos!",
    it: "Benvenuti!",
    fr: "Bienvenue !"
  },
  "Nuestra Casa es Tu Casa": {
    es: "Nuestra Casa es Tu Casa",
    en: "Our House is Your House",
    pt: "Nossa Casa é Sua Casa",
    it: "La Nostra Casa è La Tua Casa",
    fr: "Notre Maison est Votre Maison"
  },
  "Donde la fe encuentra": {
    es: "Donde la fe encuentra",
    en: "Where faith finds",
    pt: "Onde a fé encontra",
    it: "Dove la fede trova",
    fr: "Où la foi trouve"
  },
  "una familia.": {
    es: "una familia.",
    en: "a family.",
    pt: "uma família.",
    it: "una famiglia.",
    fr: "une famille."
  },
  "Ubicados en el corazón de Hartford, somos una comunidad dedicada a levantar y exaltar a Cristo, y a servir a nuestro prójimo con amor.": {
    es: "Ubicados en el corazón de Hartford, somos una comunidad dedicada a levantar y exaltar a Cristo, y a servir a nuestro prójimo con amor.",
    en: "Located in the heart of Hartford, we are a community dedicated to lifting up and exalting Christ, and serving our neighbor with love.",
    pt: "Localizados no coração de Hartford, somos uma comunidade dedicada a levantar e exaltar a Cristo, e a servir ao nosso próximo com amor.",
    it: "Situati nel cuore di Hartford, siamo una comunità dedicata a innalzare ed esaltare Cristo, ed a servire il nostro prossimo con amore.",
    fr: "Situés au cœur de Hartford, nous sommes une communauté dédiée à élever et à exalter le Christ, et à servir notre prochain avec amour."
  },
  "Ubicados en el corazón de Hartford, somos una comunidad dedicada a exaltar a Cristo y servir a nuestro prójimo con amor.": {
    es: "Ubicados en el corazón de Hartford, somos una comunidad dedicada a exaltar a Cristo y servir a nuestro prójimo con amor.",
    en: "Located in the heart of Hartford, we are a community dedicated to exalting Christ and serving our neighbor with love.",
    pt: "Localizados no coração de Hartford, somos uma comunidade dedicada a levantar e exaltar a Cristo, e a servir ao nosso próximo com amor.",
    it: "Situati nel cuore di Hartford, siamo una comunità dedicata ad esaltare Cristo e servire il nostro prossimo con amore.",
    fr: "Situés au cœur de Hartford, nous sommes une communauté dédiée à exalter le Christ et à servir notre prochain avec amour."
  },
  "Unidos en fe, esperanza y caridad. Una comunidad dedicada a la transformación de vidas a través de la Palabra de Dios.": {
    es: "Unidos en fe, esperanza y caridad. Una comunidad dedicada a la transformación de vidas a través de la Palabra de Dios.",
    en: "United in faith, hope, and charity. A community dedicated to the transformation of lives through the Word of God.",
    pt: "Unidos em fé, esperança e caridade. Uma comunidade dedicada à transformação de vidas através da Palavra de Deus.",
    it: "Uniti in fede, speranza e carità. Una comunità dedicata alla trasformazione delle vite attraverso la Parola di Dio.",
    fr: "Unis dans la foi, l'espérance et la charité. Une communauté dédiée à la transformation des vies à travers la Parole de Dieu."
  },
  // Default Services Days & descriptions
  "Domingo": {
    es: "Domingo",
    en: "Sunday",
    pt: "Domingo",
    it: "Domenica",
    fr: "Dimanche"
  },
  "Miércoles": {
    es: "Miércoles",
    en: "Wednesday",
    pt: "Quarta-feira",
    it: "Mercoledì",
    fr: "Mercredi"
  },
  "Culto Principal de Adoración": {
    es: "Culto Principal de Adoración",
    en: "Main Worship Service",
    pt: "Culto Principal de Adoração",
    it: "Culto Principale di Adorazione",
    fr: "Culte Principal d'Adoration"
  },
  "Estudio Bíblico y Oración": {
    es: "Estudio Bíblico y Oración",
    en: "Bible Study & Prayer",
    pt: "Estudo Bíblico e Oração",
    it: "Studio Biblico e Preghiera",
    fr: "Étude Biblique et Prière"
  },
  // Default Events
  "Congreso de Mujeres 2024": {
    es: "Congreso de Mujeres 2024",
    en: "Women's Conference 2024",
    pt: "Conferência de Mulheres 2024",
    it: "Congresso delle Donne 2024",
    fr: "Congrès des Femmes 2024"
  },
  "Un tiempo de renovación y empoderamiento para todas las mujeres de nuestra comunidad.": {
    es: "Un tiempo de renovación y empoderamiento para todas las mujeres de nuestra comunidad.",
    en: "A time of renewal and empowerment for all the women of our community.",
    pt: "Um tempo de renovação e empoderamento para todas as mulheres de nossa comunidade.",
    it: "Un tempo di rinnovamento e rafforzamento per tutte le donne della nostra comunità.",
    fr: "Un temps de renouvellement et d'autonomisation pour toutes les femmes de notre communauté."
  },
  "Santuario Principal": {
    es: "Santuario Principal",
    en: "Main Sanctuary",
    pt: "Santuário Principal",
    it: "Santuario Principale",
    fr: "Sanctuaire Principal"
  },
  // Ministries
  "Ministerio Infantil": {
    es: "Ministerio Infantil",
    en: "Children's Ministry",
    pt: "Ministério Infantil",
    it: "Ministero dei Bambini",
    fr: "Ministère de l'Enfance"
  },
  "Criando a la próxima generación en el temor y conocimiento del Señor a través de métodos creadivos y divertidos.": {
    es: "Criando a la próxima generación en el temor y conocimiento del Señor a través de métodos creadivos y divertidos.",
    en: "Raising the next generation in the fear and knowledge of the Lord through creative and fun methods.",
    pt: "Criando a próxima geração no temor e conhecimento do Senhor por meio de métodos criativos e divertidos.",
    it: "Crescere la prossima generazione nel timore e nella conoscenza del Signore attraverso metodi creativi e divertenti.",
    fr: "Élever la prochaine génération dans la crainte et la connaissance du Seigneur grâce à des méthodes créatives et amusantes."
  },
  "Criando a la próxima generación en el temor y conocimiento del Señor a través de métodos creativos y divertidos.": {
    es: "Criando a la próxima generación en el temor y conocimiento del Señor a través de métodos creadivos y divertidos.",
    en: "Raising the next generation in the fear and knowledge of the Lord through creative and fun methods.",
    pt: "Criando a próxima geração no temor e conhecimento do Senhor por meio de métodos criativos e divertidos.",
    it: "Crescere la prossima generazione nel timore e nella conoscenza del Signore attraverso metodi creativi e divertenti.",
    fr: "Élever la prochaine génération dans la crainte et la connaissance du Seigneur grâce à des méthodes créatives et amusantes."
  },
  "Sociedad de Jóvenes": {
    es: "Sociedad de Jóvenes",
    en: "Youth Society",
    pt: "Sociedade de Jovens",
    it: "Società dei Giovani",
    fr: "Société des Jeunes"
  },
  "Empoderando a la juventud para vivir una vida con propósito, centrada en Cristo en un mundo cambiante.": {
    es: "Empoderando a la juventud para vivir una vida con propósito, centrada en Cristo en un mundo cambiante.",
    en: "Empowering youth to live a life with purpose, centered in Christ in a changing world.",
    pt: "Empoderando a juventude para viver uma vida com propósito, centrada em Cristo em um mundo em constante mudança.",
    it: "Responsabilizzare i giovani a vivere una vita piena di scopo, incentrata su Cristo in un mondo in cambiamento.",
    fr: "Donner aux jeunes les moyens de mener une vie pleine de sens, centrée sur le Christ dans un monde en mutation."
  },
  "Alabanza y Adoración": {
    es: "Alabanza y Adoración",
    en: "Praise & Worship",
    pt: "Louvor e Adoração",
    it: "Lode e Adorazione",
    fr: "Louange et Adoration"
  },
  "Guiando a la congregación al trono de la gracia a través de la música y la excelencia técnica.": {
    es: "Guiando a la congregación al trono de la gracia a través de la música y la excelencia técnica.",
    en: "Guiding the congregation to the throne of grace through music and technical excellence.",
    pt: "Guiando a congregação ao trono da graça através da música e excelência técnica.",
    it: "Guidare la congregazione al trono della grazia attraverso la musica e l'eccellenza tecnica.",
    fr: "Guider l'assemblée vers le trône de la grâce par la musique et l'excellence technique."
  },
  "Estudios Bíblicos": {
    es: "Estudios Bíblicos",
    en: "Bible Studies",
    pt: "Estudos Bíblicos",
    it: "Studi Biblici",
    fr: "Études Bibliques"
  },
  "Formación teológica sistemática para equipar a todo santo para la obra del ministerio.": {
    es: "Formación teológica sistemática para equipar a todo santo para la obra del ministerio.",
    en: "Systematic theological training to equip every saint for the work of ministry.",
    pt: "Treinamento teológico sistemático para equipar cada santo para a obra do ministério.",
    it: "Formazione teologica sistematica per equipaggiare ogni santo per l'opera del ministero.",
    fr: "Formation théologique systématique pour équiper chaque saint pour l'œuvre du ministère."
  },
  "Obra Social": {
    es: "Obra Social",
    en: "Social Work",
    pt: "Ação Social",
    it: "Opera Sociale",
    fr: "Action Sociale"
  },
  "Reflejando la compasión de Cristo mediante el servicio tangible a los miembros más vulnerables de Hartford.": {
    es: "Reflejando la compasión de Cristo mediante el servicio tangible a los miembros más vulnerables de Hartford.",
    en: "Reflecting Christ's compassion through tangible service to Hartford's most vulnerable members.",
    pt: "Refletindo a compaixão de Cristo por meio de serviços tangíveis aos membros mais vulneráveis de Hartford.",
    it: "Riflettere la compassione di Cristo attraverso un servizio tangibile ai membri più vulnerabili di Hartford.",
    fr: "Refléter la compassion du Christ par un service concret auprès des membres les plus vulnérables de Hartford."
  },
  "Confraternidad": {
    es: "Confraternidad",
    en: "Fellowship",
    pt: "Comunhão",
    it: "Confraternita",
    fr: "Fraternité"
  },
  "Fortaleciendo el cuerpo de Cristo a través del compañerismo, la hospitalidad y la koinonia.": {
    es: "Fortaleciendo el cuerpo de Cristo a través del compañerismo, la hospitalidad y la koinonia.",
    en: "Strengthening the body of Christ through fellowship, hospitality, and koinonia.",
    pt: "Fortalecendo o corpo de Cristo através da comunhão, hospitalidade e koinonia.",
    it: "Rafforzare il corpo di Cristo attraverso la fratellanza, l'ospitalità e la koinonia.",
    fr: "Renforcer le corps du Christ par la communion, l'hospitalité et la koinonia."
  },
  // Default gallery
  "Retiro de Jóvenes": {
    es: "Retiro de Jóvenes",
    en: "Youth Retreat",
    pt: "Retiro de Jovens",
    it: "Ritiro dei Giovani",
    fr: "Retraite des Jeunes"
  },
  "Mayo 2024": {
    es: "Mayo 2024",
    en: "May 2024",
    pt: "Maio 2024",
    it: "Maggio 2024",
    fr: "Mai 2024"
  }
};

/**
 * Translates a given text lookup from the dictionary or formats date values.
 */
export function translateText(text: string | undefined | null, lang: LanguageCode): string {
  if (!text) return '';
  if (lang === 'es') return text;

  const trimmed = text.trim();
  
  // Direct matching
  if (TEXT_PHRASE_DICTIONARY[trimmed]) {
    return TEXT_PHRASE_DICTIONARY[trimmed][lang];
  }

  // Fallback matching for partial phrases, dates, days, etc.
  let translated = trimmed;

  // Day translations
  const daysMap: Record<string, Record<LanguageCode, string>> = {
    "Domingo": { es: "Domingo", en: "Sunday", pt: "Domingo", it: "Domenica", fr: "Dimanche" },
    "Lunes": { es: "Lunes", en: "Monday", pt: "Segunda-feira", it: "Lunedì", fr: "Lundi" },
    "Martes": { es: "Martes", en: "Tuesday", pt: "Terça-feira", it: "Martedì", fr: "Mardi" },
    "Miércoles": { es: "Miércoles", en: "Wednesday", pt: "Quarta-feira", it: "Mercoledì", fr: "Mercredi" },
    "Jueves": { es: "Jueves", en: "Thursday", pt: "Quinta-feira", it: "Giovedì", fr: "Jeudi" },
    "Viernes": { es: "Viernes", en: "Friday", pt: "Sexta-feira", it: "Venerdì", fr: "Vendredi" },
    "Sábado": { es: "Sábado", en: "Saturday", pt: "Sábado", it: "Sabato", fr: "Samedi" }
  };

  const monthsMap: Record<string, Record<LanguageCode, string>> = {
    "Enero": { es: "Enero", en: "January", pt: "Janeiro", it: "Gennaio", fr: "Janvier" },
    "Febrero": { es: "Febrero", en: "February", pt: "Fevereiro", it: "Febbraio", fr: "Février" },
    "Marzo": { es: "Marzo", en: "March", pt: "Março", it: "Marzo", fr: "Mars" },
    "Abril": { es: "Abril", en: "April", pt: "Abril", it: "Aprile", fr: "Avril" },
    "Mayo": { es: "Mayo", en: "May", pt: "Maio", it: "Maggio", fr: "Mai" },
    "Junio": { es: "Junio", en: "June", pt: "Junho", it: "Giugno", fr: "Juin" },
    "Julio": { es: "Julio", en: "July", pt: "Julho", it: "Luglio", fr: "Juillet" },
    "Agosto": { es: "Agosto", en: "August", pt: "Agosto", it: "Agosto", fr: "Août" },
    "Septiembre": { es: "Septiembre", en: "September", pt: "Setembro", it: "Settembre", fr: "Septembre" },
    "Octubre": { es: "Octubre", en: "October", pt: "Outubro", it: "Ottobre", fr: "Octobre" },
    "Noviembre": { es: "Noviembre", en: "November", pt: "Novembro", it: "Novembre", fr: "Novembre" },
    "Diciembre": { es: "Diciembre", en: "December", pt: "Dezembro", it: "Dicembre", fr: "Décembre" }
  };

  // Replace months and days
  for (const [key, map] of Object.entries(daysMap)) {
    const rx = new RegExp(`\\b${key}\\b`, 'gi');
    translated = translated.replace(rx, map[lang]);
  }
  for (const [key, map] of Object.entries(monthsMap)) {
    const rx = new RegExp(`\\b${key}\\b`, 'gi');
    translated = translated.replace(rx, map[lang]);
  }

  // Specific common words/prepositions
  if (lang === 'en') {
    translated = translated
      .replace(/\bde\b/gi, 'of')
      .replace(/\by\b/gi, 'and')
      .replace(/\bcon\b/gi, 'with');
  } else if (lang === 'pt') {
    translated = translated
      .replace(/\bde\b/gi, 'de')
      .replace(/\by\b/gi, 'e')
      .replace(/\bcon\b/gi, 'com');
  }

  return translated;
}
