/**
 * FinBuddy AI Chatbot
 * This module handles the chatbot functionality for answering financial questions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize chatbot
    initChatbot();
});

function initChatbot() {
    // Get chatbot elements
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const minimizeBtn = document.getElementById('minimize-chatbot');
    const closeBtn = document.getElementById('close-chatbot');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input-field');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    
    // Toggle chatbot visibility
    if (chatbotToggle && chatbotWidget) {
        chatbotToggle.addEventListener('click', function() {
            chatbotWidget.classList.toggle('active');
            this.classList.toggle('active');
            
            // Focus on input field when opened
            if (chatbotWidget.classList.contains('active')) {
                chatbotInput.focus();
            }
        });
    }
    
    // Minimize chatbot
    if (minimizeBtn && chatbotWidget && chatbotToggle) {
        minimizeBtn.addEventListener('click', function() {
            chatbotWidget.classList.remove('active');
            chatbotToggle.classList.remove('active');
        });
    }
    
    // Close chatbot
    if (closeBtn && chatbotWidget && chatbotToggle) {
        closeBtn.addEventListener('click', function() {
            chatbotWidget.classList.remove('active');
            chatbotToggle.classList.remove('active');
        });
    }
    
    // Send message on button click
    if (chatbotSendBtn) {
        chatbotSendBtn.addEventListener('click', sendMessage);
    }
    
    // Send message on Enter key
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Handle quick question buttons
    const quickQuestionBtns = document.querySelectorAll('.quick-question-btn');
    if (quickQuestionBtns) {
        quickQuestionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const question = this.textContent;
                addUserMessage(question);
                
                // Add slight delay for natural feel
                setTimeout(() => {
                    processUserMessage(question);
                }, 500);
            });
        });
    }
    
    // Function to send a message
    function sendMessage() {
        const message = chatbotInput.value.trim();
        
        if (message) {
            addUserMessage(message);
            chatbotInput.value = '';
            
            // Process the message with slight delay
            setTimeout(() => {
                processUserMessage(message);
            }, 500);
        }
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `<div class="message-content">${message}</div>`;
        chatbotMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Add AI message to chat
    function addAIMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = `<div class="message-content">${message}</div>`;
        chatbotMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Process user message and get AI response
    function processUserMessage(message) {
        // Get response from ML model
        let response;
        try {
            response = finBuddyML.answerFinancialQuestion(message);
        } catch (error) {
            response = "I'm having trouble processing your question. Please try again.";
            console.error("Error processing message:", error);
        }
        
        // Add AI response to chat
        addAIMessage(response);
        
        // If this was a budget question, maybe suggest related questions
        if (message.toLowerCase().includes('budget')) {
            setTimeout(() => {
                const followUpElement = document.createElement('div');
                followUpElement.className = 'quick-questions';
                followUpElement.innerHTML = `
                    <button class="quick-question-btn">How to reduce expenses?</button>
                    <button class="quick-question-btn">Budgeting apps?</button>
                `;
                chatbotMessages.appendChild(followUpElement);
                
                // Add event listeners to new buttons
                followUpElement.querySelectorAll('.quick-question-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const question = this.textContent;
                        addUserMessage(question);
                        
                        setTimeout(() => {
                            processUserMessage(question);
                        }, 500);
                    });
                });
                
                // Scroll to bottom
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }, 1000);
        }
    }
}
