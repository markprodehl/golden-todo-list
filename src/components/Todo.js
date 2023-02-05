import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import './Todo.css'
import SignUp from './SignUp';
import Login from './Login';
// This imports the Firebase configuration data from a gitignore file
import firebaseConfig from '../config/firebaseConfig'

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("todos");

function Todo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleSignUp = () => {
    setShowSignUp(true);
    setShowLogin(false);
  };

  const handleLogin = () => {
    setShowLogin(true);
    setShowSignUp(false);
  };

  const handleSignOut = () => {
    firebase.auth().signOut();
    setUser(null);
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(registration => {
          console.log("Service worker registered: ", registration);
      })
        .catch(error => {
          console.error("Service worker registration failed: ", error);
      });
    }

    if (user) {
      const todoListener = db.child(user.uid).on("value", (snapshot) => {
        const data = snapshot.val();
        const todos = Object.keys(data || {}).map((key) => ({
          id: key,
          ...data[key],
        }));
        setTodos(todos);
      });
      return () => {
        db.child(user.uid).off("value", todoListener);
      };
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;
    db.child(user.uid).push({ text: newTodo, done: false });
    setNewTodo("");
  };

  const handleToggle = (id) => {
    db.child(user.uid).child(id).update({ done: !todos.find((t) => t.id === id).done });
  };

  const handleEdit = (id, text) => {
    db.child(user.uid).child(id).update({ text });
  };

  const handleDelete = (id) => {
    db.child(user.uid).child(id).remove();
  };

  return (
    <div>
      {user ? (
        <div>
          <h1 className="header">Chalk Board</h1>
          <button onClick={handleSignOut}>Sign Out</button>
          <form onSubmit={handleSubmit}>
            <input
              className="addTodo"
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add item . . ."
            />
            <button type="submit">Add Item</button>
          </form>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => handleToggle(todo.id)}
                />
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => handleEdit(todo.id, e.target.value)}
                />
                <button onClick={() => handleDelete(todo.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleLogin}>Login</button>
          {showSignUp && <SignUp />}
          {showLogin && <Login />}
        </div>
      )}
    </div>
  );

}

export default Todo;