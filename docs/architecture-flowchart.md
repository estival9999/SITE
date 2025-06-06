# Fluxograma do Sistema Auralis - Comunicados Corporativos

## 1. Fluxo Geral do Sistema

```mermaid
flowchart TB
    Start([Usuário Acessa o Site]) --> Auth{Usuário Autenticado?}
    Auth -->|Não| Login[Página de Login]
    Auth -->|Sim| Home[Dashboard Principal]
    
    Login --> Validate{Credenciais Válidas?}
    Validate -->|Não| Login
    Validate -->|Sim| CreateSession[Criar Sessão]
    CreateSession --> CheckRole{Verificar Role}
    
    CheckRole -->|ADMIN| AdminHome[Home Admin]
    CheckRole -->|READER| ReaderHome[Home Leitor]
    
    AdminHome --> AdminOptions{Opções Admin}
    AdminOptions --> |1| ViewAnnouncements[Ver Comunicados]
    AdminOptions --> |2| CreateAnnouncement[Criar Comunicado]
    AdminOptions --> |3| ManageUsers[Gerenciar Usuários]
    AdminOptions --> |4| ViewReceivedQuestions[Ver Perguntas Recebidas]
    AdminOptions --> |5| MyQuestions[Minhas Perguntas]
    AdminOptions --> |6| Search[Buscar Conhecimento]
    
    ReaderHome --> ReaderOptions{Opções Leitor}
    ReaderOptions --> |1| ViewAnnouncements
    ReaderOptions --> |2| MyQuestions
    ReaderOptions --> |3| Search
    
    ViewAnnouncements --> Filter[Filtrar por Dept/Local/Categoria]
    Filter --> AnnouncementList[Lista de Comunicados]
    AnnouncementList --> Actions{Ações}
    Actions --> |1| MarkAsRead[Marcar como Lido]
    Actions --> |2| AskQuestion[Fazer Pergunta]
    Actions --> |3| ViewPDF[Ver Anexo PDF]
    Actions --> |4| Delete[Deletar<br/>Apenas Autor]
```

## 2. Fluxo de Criação de Comunicados (Admin)

```mermaid
flowchart LR
    Start([Admin Clica em<br/>Registrar Comunicado]) --> Form[Preencher Formulário]
    
    Form --> FillData{Dados do Comunicado}
    FillData --> Title[Título]
    FillData --> Message[Mensagem]
    FillData --> Dept[Departamento]
    FillData --> Category[Categoria]
    FillData --> Locations[Localizações Alvo]
    FillData --> PDF[Anexar PDF<br/>Opcional]
    
    Title --> Validate
    Message --> Validate
    Dept --> Validate
    Category --> Validate
    Locations --> Validate
    PDF --> Validate
    
    Validate{Validar Dados} -->|Válido| Save[Salvar no Banco]
    Validate -->|Inválido| ShowError[Mostrar Erros]
    ShowError --> Form
    
    Save --> Notify[Notificar Usuários<br/>das Localizações]
    Notify --> Success[Comunicado Criado]
```

## 3. Fluxo de Perguntas e Respostas

```mermaid
flowchart TD
    UserView([Usuário Visualiza<br/>Comunicado]) --> Question{Fazer Pergunta?}
    Question -->|Sim| WriteQuestion[Escrever Pergunta]
    Question -->|Não| End1([Fim])
    
    WriteQuestion --> Submit[Enviar Pergunta]
    Submit --> SaveQuestion[Salvar no Banco]
    SaveQuestion --> NotifyAdmin[Notificar Admin<br/>Autor do Comunicado]
    
    NotifyAdmin --> AdminView[Admin Vê em<br/>Perguntas Recebidas]
    AdminView --> Answer{Responder?}
    Answer -->|Sim| WriteAnswer[Escrever Resposta]
    Answer -->|Não| End2([Fim])
    
    WriteAnswer --> SaveAnswer[Salvar Resposta]
    SaveAnswer --> MarkResolved[Marcar como<br/>Resolvida]
    MarkResolved --> NotifyUser[Usuário Vê<br/>Resposta]
```

## 4. Fluxo de Permissões e Acesso

```mermaid
flowchart LR
    User([Usuário]) --> CheckAuth{Autenticado?}
    CheckAuth -->|Não| Redirect1[Redirecionar<br/>para Login]
    CheckAuth -->|Sim| CheckRole{Verificar Role}
    
    CheckRole --> |ADMIN| AdminPerms[Permissões Admin]
    CheckRole --> |READER| ReaderPerms[Permissões Leitor]
    
    AdminPerms --> AP1[Ver Todos Comunicados<br/>do Seu Departamento]
    AdminPerms --> AP2[Criar Comunicados]
    AdminPerms --> AP3[Responder Perguntas]
    AdminPerms --> AP4[Gerenciar Usuários]
    AdminPerms --> AP5[Deletar Próprios<br/>Comunicados]
    
    ReaderPerms --> RP1[Ver Comunicados<br/>das Suas Localizações]
    ReaderPerms --> RP2[Fazer Perguntas]
    ReaderPerms --> RP3[Marcar como Lido]
    ReaderPerms --> RP4[Buscar Conhecimento]
```

## 5. Estrutura de Dados

```mermaid
erDiagram
    USERS ||--o{ ANNOUNCEMENTS : creates
    USERS ||--o{ QUESTIONS : asks
    USERS ||--o{ QUESTIONS : answers
    USERS ||--o{ READ_STATUS : marks
    ANNOUNCEMENTS ||--o{ QUESTIONS : has
    ANNOUNCEMENTS ||--o{ READ_STATUS : tracked_by
    
    USERS {
        uuid id PK
        string username UK
        string passwordHash
        string name
        enum role "ADMIN|READER"
        string assignedLocations "Array"
        string actingDepartment "Optional"
        timestamp createdAt
        timestamp updatedAt
    }
    
    ANNOUNCEMENTS {
        uuid id PK
        string title
        text message
        enum department
        enum category
        string targetLocations "Array"
        string attachment "Optional PDF"
        uuid authorId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    QUESTIONS {
        uuid id PK
        text question
        text answer "Optional"
        boolean isResolved
        uuid announcementId FK
        uuid userId FK
        uuid answeredBy FK "Optional"
        timestamp createdAt
        timestamp updatedAt
    }
    
    READ_STATUS {
        uuid id PK
        uuid userId FK
        uuid announcementId FK
        boolean isRead
        timestamp readAt
        timestamp createdAt
    }
```

## 6. Fluxo de Autenticação Detalhado

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant S as Session Store
    
    U->>F: Acessa /auth
    F->>U: Mostra formulário login
    U->>F: Insere credenciais
    F->>B: POST /api/login
    B->>DB: Busca usuário
    DB-->>B: Dados do usuário
    B->>B: Valida senha (bcrypt)
    alt Credenciais válidas
        B->>S: Cria sessão
        S-->>B: Session ID
        B-->>F: 200 OK + User data
        F->>F: Salva no contexto
        F->>U: Redireciona para /announcements
    else Credenciais inválidas
        B-->>F: 401 Unauthorized
        F->>U: Mostra erro
    end
```

## 7. Estados do Sistema

```mermaid
stateDiagram-v2
    [*] --> NaoAutenticado
    NaoAutenticado --> Autenticando : Login
    Autenticando --> Autenticado : Sucesso
    Autenticando --> NaoAutenticado : Falha
    
    Autenticado --> VisualizandoComunicados
    Autenticado --> CriandoComunicado : Se Admin
    Autenticado --> GerenciandoUsuarios : Se Admin
    Autenticado --> FazendoPergunta
    Autenticado --> PesquisandoConhecimento
    
    VisualizandoComunicados --> FiltrandoComunicados
    FiltrandoComunicados --> VisualizandoComunicados
    
    CriandoComunicado --> PreenchendoFormulario
    PreenchendoFormulario --> ValidandoDados
    ValidandoDados --> SalvandoComunicado : Válido
    ValidandoDados --> PreenchendoFormulario : Inválido
    SalvandoComunicado --> VisualizandoComunicados
    
    FazendoPergunta --> EscrevendoPergunta
    EscrevendoPergunta --> EnviandoPergunta
    EnviandoPergunta --> AguardandoResposta
    AguardandoResposta --> PerguntaRespondida
    
    Autenticado --> NaoAutenticado : Logout
    NaoAutenticado --> [*]
```

## Legenda

- **ADMIN**: Administrador do sistema
- **READER**: Leitor/usuário comum
- **Departamentos**: CONTROLES_INTERNOS, ADMINISTRATIVO, CICLO_DE_CREDITO
- **Categorias**: INFORMATIVO, ATUALIZACAO, DETERMINACAO
- **Localizações**: MARACAJU, SIDROLANDIA, AQUIDAUANA, NIOAQUE

---

Este fluxograma representa a estrutura completa do sistema Auralis, mostrando como os diferentes componentes interagem e como os usuários navegam através das funcionalidades disponíveis.