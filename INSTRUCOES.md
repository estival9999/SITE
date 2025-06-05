# Instruções para Executar o Site Auralis

## Problema Identificado
O servidor não está conseguindo iniciar corretamente via scripts automatizados. 
Você precisa executá-lo manualmente.

## Como Executar

1. **Abra um novo terminal**

2. **Navegue até a pasta do projeto:**
   ```bash
   cd "/home/mateus/Área de trabalho/SITE_REPLIT"
   ```

3. **Execute o servidor:**
   ```bash
   DEMO_MODE=true SESSION_SECRET=auraliscommunication npm run dev
   ```

4. **Aguarde a mensagem:** `serving on port 5000`

5. **Abra o navegador em:** http://localhost:5000

## Credenciais de Login

- **Administrador:**
  - Usuário: `admin`
  - Senha: `admin`

- **Usuário Comum:**
  - Usuário: `user`
  - Senha: `user`

## Se a Porta 5000 Não Funcionar

Tente com a porta 3000:
```bash
PORT=3000 DEMO_MODE=true SESSION_SECRET=auraliscommunication npm run dev
```

E acesse: http://localhost:3000

## Solução de Problemas

Se ainda não funcionar:

1. **Verifique se há algum erro no terminal**
2. **Tente executar com sudo:**
   ```bash
   sudo PORT=8080 DEMO_MODE=true SESSION_SECRET=auraliscommunication npm run dev
   ```
3. **Verifique se não há firewall bloqueando**

## Alternativa - Build de Produção

Se o modo desenvolvimento não funcionar, tente:

```bash
# Build
npm run build

# Executar
DEMO_MODE=true SESSION_SECRET=auraliscommunication npm start
```