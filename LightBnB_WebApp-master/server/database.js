const properties = require('./json/properties.json');
// const users = require('./json/users.json');

const { Pool } = require('pg');
// const args = process.argv.slice(2);
// console.log(args);
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  // let user;
  return pool
  .query(`
    SELECT * FROM users
    WHERE email = $1;
    `,
    [email])
  .then((result) => result.rows[0])
  .catch((err) => err.message);

  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);
  return pool
  .query(`
    SELECT * FROM users
    WHERE  id = $1;
    `,
    [id])
  .then((result) => result.rows[0])
  .catch((err) => err.message);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
  return pool
  .query(`
    INSERT INTO users(name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [user.name, user.email, user.password])
  .then((result) => result.rows[0])
  .catch((err) => err.message);

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  return pool
    .query(`
    SELECT properties.id, properties.title, cost_per_night, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
      `,
      [guest_id, limit])
    .then((result) => result.rows)
    .catch((err) => err.message);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // const limitedProperties = {};
  // for (let i = 1; i <= limit; i++) {
  //   limitedProperties[i] = properties[i];
  // }
  // return Promise.resolve(limitedProperties);
  // return pool
  //   .query(`
  //     SELECT * FROM properties
  //     LIMIT $1;
  //     `,
  //     [limit])
  //   .then((result) => result.rows)
  //   .catch((err) => err.message);

  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} `;
  }
  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night));
    queryString += `AND cost_per_night >= $${queryParams.length} * 100 `;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night));
    queryString += `AND cost_per_night <= $${queryParams.length} * 100 `;
  }
  queryString += `GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
  const queryParams = [];

  // To add to query string: $1, $2, $3...
  const queryParamsNums = [];

  let numOfKeys = 1;
  for (const key in property) {
    // push the actual value
    queryParams.push(property[key]);
    // push the index of the value as "$(index + 1)"
    queryParamsNums.push(`$${numOfKeys}`);
    numOfKeys++;
  }

  let queryString =  `
  INSERT INTO properties (${Object.keys(property).join()})
  VALUES(${queryParamsNums.join()})
  RETURNING *;
  `;
  // console.log(queryString, queryParams);

  return pool.query(queryString, queryParams)
  .then(result => {
    return result.rows[0];
  })
  .catch(err => console.log(err.message));
}
exports.addProperty = addProperty;
