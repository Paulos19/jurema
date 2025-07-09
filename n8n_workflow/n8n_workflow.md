# Fluxo n8n: Cadastro de Cliente via WhatsApp

Este documento descreve um fluxo inicial no n8n para iniciar o cadastro de clientes via WhatsApp, integrando com a Evolution API e o backend Jurema.

## Visão Geral do Fluxo

O fluxo começa com o recebimento de uma mensagem via webhook (Evolution API), busca o usuário credor pelo `uniqueCode`, cria uma nova conversa no backend e envia uma mensagem de boas-vindas ao cliente.

## Passos Detalhados

1.  **Webhook (Trigger)**
    *   **Tipo:** Webhook
    *   **Configuração:**
        *   **HTTP Method:** `POST`
        *   **Path:** `webhook` (ou qualquer outro path que você configurar na Evolution API)
    *   **Função:** Este nó aguarda e recebe as mensagens enviadas pela Evolution API. A Evolution API deve ser configurada para enviar as mensagens recebidas para a URL deste webhook.
    *   **Saída Esperada:** Um JSON contendo os dados da mensagem, incluindo `from` (número do remetente) e `body` (conteúdo da mensagem).

2.  **Get User by Unique Code (HTTP Request)**
    *   **Tipo:** HTTP Request
    *   **Configuração:**
        *   **Method:** `GET`
        *   **URL:** `http://localhost:3000/api/user/{{$json.body.uniqueCode}}`
            *   **Observação:** Substitua `localhost:3000` pelo endereço do seu backend Jurema. O `uniqueCode` será extraído do corpo da mensagem recebida pelo Webhook.
    *   **Função:** Este nó faz uma requisição ao seu backend Jurema para obter os detalhes do usuário (credor) associado ao `uniqueCode` enviado pelo cliente via WhatsApp. É crucial que o cliente envie o `uniqueCode` na primeira mensagem para que este passo funcione.
    *   **Conexão:** Conectado do nó `Webhook`.

3.  **Create Conversation (HTTP Request)**
    *   **Tipo:** HTTP Request
    *   **Configuração:**
        *   **Method:** `POST`
        *   **URL:** `http://localhost:3000/api/conversation`
            *   **Observação:** Substitua `localhost:3000` pelo endereço do seu backend Jurema.
        *   **Body (JSON):**
            ```json
            {
              "userId": "={{$node["Get User by Unique Code"].json["id"]}}",
              "clientWhatsapp": "={{$json.body.from}}",
              "status": "IDLE",
              "currentStep": "ask_name"
            }
            ```
            *   `userId`: Obtido do resultado do nó "Get User by Unique Code".
            *   `clientWhatsapp`: Obtido do campo `from` da mensagem do Webhook.
            *   `status`: Define o estado inicial da conversa.
            *   `currentStep`: Indica qual será o próximo passo na interação com o cliente.
    *   **Função:** Este nó cria um novo registro de conversa no seu backend Jurema, associando o cliente (pelo WhatsApp) ao credor e definindo o estado inicial do fluxo de cadastro.
    *   **Conexão:** Conectado do nó "Get User by Unique Code".

4.  **Send Welcome Message (HTTP Request)**
    *   **Tipo:** HTTP Request
    *   **Configuração:**
        *   **Method:** `POST`
        *   **URL:** `YOUR_EVOLUTION_API_URL/message/sendText/YOUR_INSTANCE_NAME`
            *   **Observação:** Substitua `YOUR_EVOLUTION_API_URL` pela URL da sua instância da Evolution API e `YOUR_INSTANCE_NAME` pelo nome da sua instância.
        *   **Body (JSON):**
            ```json
            {
              "number": "={{$json.body.from}}",
              "textMessage": {
                "text": "Olá! Para iniciar o cadastro, qual é o seu nome completo?"
              }
            }
            ```
            *   `number`: O número de WhatsApp do cliente, obtido do campo `from` da mensagem do Webhook.
            *   `text`: A mensagem de boas-vindas e a primeira pergunta ao cliente.
    *   **Função:** Envia a primeira mensagem de volta ao cliente via Evolution API, solicitando o nome completo para iniciar o cadastro.
    *   **Conexão:** Conectado do nó "Create Conversation".

## Próximos Passos no n8n

Este é apenas o início do fluxo. Você precisará adicionar mais nós para:

*   **Processar Respostas:** Adicionar nós para receber as respostas do cliente (nome, CPF, endereço, etc.).
*   **Atualizar Conversa:** Fazer requisições `PUT` para o endpoint `/api/conversation/[conversationId]` no seu backend para atualizar o `currentStep` e `dataCollected`.
*   **Validação:** Adicionar lógica para validar as entradas do usuário.
*   **Criação do Cliente:** Quando todos os dados forem coletados, fazer uma requisição `POST` para `/api/criar_cliente` no seu backend.
*   **Mensagens de Sucesso/Erro:** Enviar mensagens de confirmação ou de erro ao cliente.

Lembre-se de ajustar as URLs e credenciais da Evolution API e do seu backend Jurema conforme necessário.