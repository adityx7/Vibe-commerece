# Vibe-commerece
Vibe Commerce - Mock E-Com Cart Assignment

This project is a solution for the Full-Stack Coding Assignment, demonstrating a basic e-commerce shopping cart flow.

It is built as a single, self-contained index.html file that simulates a full-stack environment (React frontend, Node/Express backend, and DB) using vanilla JavaScript, Tailwind CSS, and the Fake Store API.

Overview

The application allows users to view a list of products, add or remove items from their cart, and complete a mock checkout process. The cart state is persisted in the browser's localStorage to simulate a user session.

Features

Product Listing: Fetches and displays products from the live https://fakestoreapi.com.

Add to Cart: Users can add products to their shopping cart from the product list.

Cart Management: A sidebar displays all items in the cart, quantities, and the running total.

Remove from Cart: Users can remove items individually from the cart.

Persistent Cart: The cart is saved to localStorage, so items remain even after refreshing or closing the browser.

Mock Checkout: A checkout form collects user details (name, email).

Mock Receipt: On checkout, a success modal appears with a mock receipt.

Error Handling: A non-blocking toast notification appears if API calls (e.g., fetching products) fail.

Responsive Design: The layout adapts for both mobile and desktop screens.

Loading States: Spinners provide visual feedback when adding/removing items or checking out.

Tech Stack (Simulated)

This project simulates the architecture requested in the assignment:

Frontend (Simulated React): Built with Vanilla JavaScript and Tailwind CSS. The JS code is structured to mimic components, state management, and event handling as one would in React.

Backend (Simulated Node/Express): A mockApi object within the <script> tag acts as the backend server. It contains async functions (getProducts, addToCart, etc.) that simulate API calls, complete with network delays.

Database (Simulated MongoDB/SQLite):

Product data is fetched live from the Fake Store API.

Cart data is "persisted" using the browser's localStorage, fulfilling the bonus requirement for DB persistence.

How to Run

There is no backend or frontend server to run.

Save the index.html file.

Open the index.html file in any modern web browser (e.g., Chrome, Firefox, Safari).

The application will load and be fully functional.

Simulated API Endpoints

The mockApi JavaScript object simulates the following REST API endpoints:

GET /api/products:

Implementation: mockApi.getProducts()

Action: Fetches 6 products from https://fakestoreapi.com/products and caches them.

POST /api/cart:

Implementation: mockApi.addToCart({ productId, quantity })

Action: Adds an item to the cart in localStorage and returns the updated cart.

DELETE /api/cart/:id:

Implementation: mockApi.removeFromCart(cartItemId)

Action: Removes an item from the cart in localStorage.

GET /api/cart:

Implementation: mockApi.getCart()

Action: Retrieves the current cart and total from localStorage.

POST /api/checkout:

Implementation: mockApi.checkout({ cartItems, userDetails })

Action: Simulates order processing, clears the cart, and returns a mock receipt.