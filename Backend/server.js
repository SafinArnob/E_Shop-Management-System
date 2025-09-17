import app from './app.js';
import dotenv from 'dotenv';
import db from './config/config.js';


dotenv.config();



// Database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
  connection.release();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

