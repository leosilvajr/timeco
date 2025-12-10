# Timeco - Sistema de Sorteio de Times

Sistema inteligente para sorteio equilibrado de times esportivos.

## Estrutura do Projeto

```
timeco/
├── timeco-frontend/    # Aplicação React + Vite
└── timeco-backend/     # API .NET 8.0 com DDD
    └── src/
        ├── Timeco.API/           # Controllers, JWT Auth
        ├── Timeco.Application/   # Services, DTOs, Validators
        ├── Timeco.Domain/        # Entidades, Interfaces
        └── Timeco.Infrastructure/ # DbContext, Repositories
```

## Requisitos

- Node.js 18+
- .NET 8.0 SDK
- SQL Server (LocalDB ou instancia completa)

## Configuracao do Backend

1. Navegue ate a pasta do backend:
```bash
cd timeco-backend
```

2. Configure a connection string no `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TimecoDb;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

3. Execute as migrations:
```bash
cd src/Timeco.API
dotnet ef database update --project ../Timeco.Infrastructure/Timeco.Infrastructure.csproj
```

4. Rode a API:
```bash
dotnet run
```

A API estara disponivel em: http://localhost:5000

## Configuracao do Frontend

1. Navegue ate a pasta do frontend:
```bash
cd timeco-frontend
```

2. Instale as dependencias:
```bash
npm install
```

3. Rode o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estara disponivel em: http://localhost:5173

## Usuario Padrao

Ao iniciar pela primeira vez, o sistema cria automaticamente:

- **Usuario:** admin
- **Senha:** 123

## Tecnologias Utilizadas

### Backend
- .NET 8.0
- Entity Framework Core 8
- SQL Server
- JWT Authentication
- FluentValidation
- BCrypt.Net

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- React Hot Toast
- Lucide Icons

## Endpoints da API

### Autenticacao
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro
- `GET /api/auth/me` - Usuario atual

### Esportes
- `GET /api/sports` - Listar esportes
- `GET /api/sports/{id}` - Obter esporte

### Jogadores
- `GET /api/players` - Listar jogadores do usuario
- `POST /api/players` - Criar jogador
- `PUT /api/players/{id}` - Atualizar jogador
- `DELETE /api/players/{id}` - Excluir jogador

### Jogos
- `GET /api/games` - Listar jogos do usuario
- `POST /api/games` - Criar jogo
- `POST /api/games/distribute` - Sortear times
- `DELETE /api/games/{id}` - Excluir jogo

## Swagger

Acesse a documentacao da API em: http://localhost:5000/swagger
