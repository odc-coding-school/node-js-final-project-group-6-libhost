const socket = io(); // Connect to the socket.io server

// Send message on button click
document.getElementById("sendButton").addEventListener("click", () => {
  const message = document.getElementById("messageInput").value;
  const messageData = {
    text: message,
    sender: "guest", // You can dynamically set sender based on the user (guest or host)
    timestamp: new Date().toLocaleTimeString(),
  };

  // Emit the message to the server
  socket.emit("sendMessage", messageData);

  // Clear the input field
  document.getElementById("messageInput").value = "";
});

// Listen for new messages from the server
socket.on("receiveMessage", (messageData) => {
  // Display received messages in the chat window
  const chatWindow = document.getElementById("chatWindow");
  const messageElement = document.createElement("p");
  messageElement.textContent = `[${messageData.timestamp}] ${messageData.sender}: ${messageData.text}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to bottom
});
