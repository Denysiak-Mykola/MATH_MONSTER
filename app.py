from flask import Flask, render_template, request, redirect, session, jsonify
from flask_socketio import SocketIO
import sqlite3

app = Flask(__name__)
app.secret_key = "secret123"
socketio = SocketIO(app)

# ---------- DB ----------
def init_db():
    conn = sqlite3.connect("game.db")
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        level INTEGER,
        gold INTEGER
    )
    """)
    conn.close()

init_db()

# ---------- ROUTES ----------
@app.route("/")
def menu():
    return render_template("menu.html")

@app.route("/map")
def map():
    return render_template("map.html")

@app.route("/game")
def game():
    if "user_id" not in session:
        return redirect("/login")
    level = request.args.get("level", 1)
    return render_template("index.html", level=level)

# ---------- AUTH ----------
@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        conn = sqlite3.connect("game.db")
        user = conn.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, password)
        ).fetchone()
        conn.close()
        if user:
            session["user_id"] = user[0]
            return redirect("/")
    return render_template("login.html")

@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        conn = sqlite3.connect("game.db")
        conn.execute(
            "INSERT INTO users (username,password,level,gold) VALUES (?,?,1,0)",
            (request.form["username"], request.form["password"])
        )
        conn.commit()
        conn.close()
        return redirect("/login")
    return render_template("register.html")

# ---------- SAVE ----------
@app.route("/save", methods=["POST"])
def save():
    data = request.json
    conn = sqlite3.connect("game.db")
    conn.execute(
        "UPDATE users SET level=?, gold=? WHERE id=?",
        (data["level"], data["gold"], session["user_id"])
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

# ---------- SOCKET ----------
@socketio.on("attack")
def handle_attack(data):
    print("Damage:", data["damage"])
    socketio.emit("enemy_hit", data)

# ---------- RUN ----------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=10000)