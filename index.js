import express from "express";
// import bodyParser, { json } from "body-parser"
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import 'dotenv/config'

const app = express();
const port = 3000;

const db = new pg.Client({
    user: process.env.USER_ID,
    host: "localhost",
    database: "books",
    password: process.env.USER_KEY,
    port: 5432,
  });
  db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res)=> {
    res.render("index.ejs")
});

app.get("/get-book", async(req, res)=> {
    try {
        const bookName = req.query.bookName;
        const apiUrl = `https://openlibrary.org/search.json?q=${bookName}`;
        
        const response = await axios.get(apiUrl);
        const result = response.data;
// console.log(result);

        const books = [];
        for (let i = 0; i < Math.min(result.docs.length, 12); i++) {
            const book = {
                title: result.docs[i].title,
                author: result.docs[i].author_name ? result.docs[i].author_name[0] : "Unknown Author",
                cover: result.docs[i].isbn[0]
            };
            books.push(book);

            }
        
        res.render("index.ejs", { books });
    } catch (error) {
    res.status(404).send(error.message);
        
    }
});

let items = [];
app.get("/books-saved", async(req, res)=> {
    // const book_saved = await getBookSaved();
    try {
        const result = await db.query("SELECT * FROM bk_read ORDER BY id ASC");
        items = result.rows;
    
        res.render("later.ejs", {
          listItems: items,
        });
      } catch (err) {
        console.log(err);
      }
});

app.post("/save-book", async (req, res) => {

    try {
      const title = req.body.title; // Get the book title from the form submission
      const author = req.body.author;
      const cover = req.body.cover;
  
    //   // Replace this with your actual database connection setup
    //   const db = require('./your-database-connection');
  
      // Insert the book title into your SQL database
      const query = 'INSERT INTO bk_read (wn_read, author, cover) VALUES ($1, $2, $3)';
      const values = [title, author, cover];
  
      await db.query(query, values); // Execute the SQL query
  
      // You can also provide a success message or redirect the user to a different page after saving the book.
    //   res.redirect(`/get-book?bookName=${title}`); // busca libros que se parecen al ese
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.post("/delete-book", async (req, res) => {
    try { 
    // const title = req.body.title;
    const id = req.body.id;

    const query = 'DELETE FROM bk_read WHERE id = $1';
    const values = [id];
    await db.query(query, values);
    //   res.render("later.ejs");.
    res.redirect("/books-saved");
    } catch (err) {
      console.log(err);
    }
  });

  app.post("/edit-book", async(req, res)=>{
    const title = req.body.bookReview;
    const id = req.body.updatedItemId;

    try {
      await db.query("UPDATE bk_read SET review = $1 WHERE id = $2", [title, id]);
      res.redirect("/books-saved");
    } catch (error) {
      console.log(error);
    }
  });

// AGREGAR UN UPDATE BUTTON PARA AÑADIR REVIES Y ADEMAS AGREVAR LA COLUMNA REVIEWS VARVHAR(80) TALVEZ UN HIDDEN INPUT PCON UN BOTON PARA BORRAR EL REVIEW

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  