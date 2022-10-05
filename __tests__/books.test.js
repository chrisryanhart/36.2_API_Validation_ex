process.env.NODE_ENV = "test";

const request = require('supertest');

const app = require('../app.js');
const db = require('../db.js');

let book1;
let book2;

beforeEach(async function() {
    await db.query("DELETE FROM books");

    let result1 = await db.query(`INSERT INTO books (
        isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year) 
     VALUES ('0123456789','http://random.com/book','Me','english',120,'good books','Reading is fun',1950) 
     RETURNING isbn,
               amazon_url,
               author,
               language,
               pages,
               publisher,
               title,
               year`);
    let result2 = await db.query(`INSERT INTO books (
        isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year) 
     VALUES ('0123456780','http://betterbooks.com/','You','spanish',145,'better read','People like reading',2001) 
     RETURNING isbn,
               amazon_url,
               author,
               language,
               pages,
               publisher,
               title,
               year`);

    book1 = result1.rows[0];
    book2 = result2.rows[0];
 
  });

/** GET / => {books: [book, ...]}  */
describe("GET /books", function(){
    test("Gets a list of all books", async () => {
        const resp = await request(app).get('/books');

        expect(resp.statusCode).toEqual(200);
        expect(resp.body.books).toContainEqual(book2);
    },50000);
});


/** GET /[id]  => {book: book} */
describe("GET /books/:isbn", function(){
    test("Gets a single book", async () => {
        const isbn = '0123456789';
        const resp = await request(app).get(`/books/${isbn}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body.book).toEqual(book1);
    },50000);
    test("Error when isbn not found",async () => {
        const isbn = '9323456789';
        const resp = await request(app).get(`/books/${isbn}`);

        expect(resp.statusCode).toEqual(404);
        expect(resp.body.error.message).toContain(`There is no book with an isbn '9323456789'`);
    });

});

describe("POST /books", function(){
    test("POST new book", async () => {
        const newBook = {
            "isbn":"5003456789",
            "amazon_url":"http://latestbooks.com",
            "author":"Chart",
            "language":"british",
            "pages":2,
            "publisher":"reading rainbow",
            "title":"Two page book",
            "year":2005
        };

        const resp = await request(app).post(`/books`).send(newBook);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body.book).toEqual(newBook);
    },50000);
    test("Error from invalid json format",async () => {
        // required field "author" missing
        const newBook = {
            "isbn":"5003456789",
            "amazon_url":"http://latestbooks.com",
            "language":"british",
            "pages":2,
            "publisher":"reading rainbow",
            "title":"Two page book",
            "year":2005
        };

        const resp = await request(app).post(`/books`).send(newBook);

        expect(resp.statusCode).toEqual(400);
        expect(resp.body.error.message[0]).toBe('instance requires property "author"');
    });

});


// PUT /books/:isbn

describe("PUT /books/:isbn", function(){
    test("Update existing book", async () => {
        const isbn = '0123456789';
        const bookToUpdate = {
            "amazon_url":"http://latestbooks.com",
            "author":"Chart",
            "language":"british",
            "pages":2,
            "publisher":"reading rainbow",
            "title":"Two page book",
            "year":2005
        };

        const resp = await request(app).put(`/books/${isbn}`).send(bookToUpdate);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body.book.language).toEqual('british');
    },50000);
    test("Error from invalid json format",async () => {
        // required field "author" missing
        const isbn = '0123456789';

        const bookToUpdate = {
            "isbn":"5003456789",
            "amazon_url":"http://latestbooks.com",
            "language":"british",
            "pages":2,
            "publisher":"reading rainbow",
            "title":"Two page book",
            "year":2005
        };

        const resp = await request(app).put(`/books/${isbn}`).send(bookToUpdate);

        expect(resp.statusCode).toEqual(400);
        expect(resp.body.error.message[0]).toBe('instance requires property "author"');
    });

});

// DELETE route 
describe("DELETE /books/:isbn", function(){
    test("DELETE existing book", async () => {
        const isbn = '0123456789';

        const resp = await request(app).delete(`/books/${isbn}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body.message).toEqual('Book deleted');
    },50000);
    test("Book to delete doesnt exist",async () => {
        // required field "author" missing
        const isbn = '1123456789';

        const resp = await request(app).delete(`/books/${isbn}`);

        expect(resp.statusCode).toEqual(404);
        expect(resp.body.error.message).toBe('There is no book with an isbn 1123456789');
    });

});

afterAll(async function() {
    // close db connection
    await db.end();
});