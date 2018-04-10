const pg = require('pg')

const query = (
  connection_string,
  query
) =>
  new Promise((resolve, reject) => {

    const client = new pg.Client(connection_string);

    client.connect((err, conn, done) => {
      if (err) {
        client.end();
        return reject(err);
      }
      console.log(
        "---------",
        "conn.processID = ",
        conn.processID,
        "---------"
      );
      console.log(query);
      console.log("---------");
      client
        .query(query)
        .then(x => {
          client.end();
          resolve(x);
        })
        .catch(x => {
          client.end();
          reject(x);
        });
    });
  });

module.exports = { query }