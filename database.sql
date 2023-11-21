SET default_storage_engine = InnoDB;
DROP DATABASE IF EXISTS `hsp-gdh`;
CREATE DATABASE IF NOT EXISTS `hsp-gdh`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS 'hsp-gdh';
CREATE USER 'hsp-gdh'@'%' IDENTIFIED BY 'PASSWORD';
GRANT ALL PRIVILEGES ON airjet.* TO 'hsp-gdh'@'%';

USE `hsp-gdh`;

CREATE TABLE pilots (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  license_number VARCHAR(255) NOT NULL,
  license_expiry DATE NOT NULL,
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
  status VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE airplanes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE airlines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(2) NOT NULL,
  logo VARCHAR(255),
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE airports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(3) NOT NULL,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE flights (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  airline_id INT UNSIGNED NOT NULL,
  pilot_id INT UNSIGNED NOT NULL,
  flight_no VARCHAR(10) NOT NULL,
  origin_id INT UNSIGNED NOT NULL,
  destination_id INT UNSIGNED NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  duration_minutes INT NOT NULL,
  price_economy DECIMAL(10,2) NOT NULL,
  price_business DECIMAL(10,2) NOT NULL,
  price_first_class DECIMAL(10,2) NOT NULL,
  status VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fl_airline_id
    FOREIGN KEY (airline_id)
    REFERENCES airlines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fl_pilot_id
    FOREIGN KEY (pilot_id)
    REFERENCES pilots(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fl_origin_id
    FOREIGN KEY (origin_id)
    REFERENCES airports(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fl_destination_id
    FOREIGN KEY (destination_id)
    REFERENCES airports(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_types (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX ut_name_idx (name)
) ENGINE=InnoDB;

INSERT INTO user_types (name) VALUES ('unverified'), ('customer'), ('support'), ('pilote'), ('staff'), ('admin');

CREATE TABLE permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX p_name_idx (name)
) ENGINE=InnoDB;

INSERT INTO permissions (name) VALUES
('view_users'), ('add_users'), ('edit_users'), ('delete_users'),
('view_flights'), ('add_flights'), ('edit_flights'), ('delete_flights'),
('view_airlines'), ('add_airlines'), ('edit_airlines'), ('delete_airlines'),
('view_airplanes'), ('add_airplanes'), ('edit_airplanes'), ('delete_airplanes'),
('view_airports'), ('add_airports'), ('edit_airports'), ('delete_airports'),
('view_seats'), ('add_seats'), ('edit_seats'), ('delete_seats'),
('view_pilots'), ('add_pilots'), ('edit_pilots'), ('delete_pilots');

CREATE TABLE user_type_permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_type_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT utp_user_type_id
    FOREIGN KEY (user_type_id)
    REFERENCES user_types(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT utp_permission_id
    FOREIGN KEY (permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE INDEX utp_user_type_permission_idx (user_type_id, permission_id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  username VARCHAR(64) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(128) NOT NULL,
  phone VARCHAR(32) DEFAULT 'None',
  user_type_id INT UNSIGNED NOT NULL,
  is_banned BOOLEAN NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT u_user_type_id
    FOREIGN KEY (user_type_id)
    REFERENCES user_types(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX ur_user_type_idx (user_type_id)
) ENGINE=InnoDB;

CREATE TABLE user_email_verifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  verification_code VARCHAR(255),
  type VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT mv_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX mv_user_id_idx (user_id)
) ENGINE=InnoDB;

CREATE TABLE seats (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED,
  flight_id INT UNSIGNED NOT NULL,
  place_no INT UNSIGNED NOT NULL,
  class VARCHAR(32) NOT NULL,
  bought_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT ps_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT ps_flight_id
    FOREIGN KEY (flight_id)
    REFERENCES flights(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX ps_user_id_idx (user_id),
  INDEX ps_flight_id_idx (flight_id)
) ENGINE=InnoDB;

INSERT INTO pilots (id, first_name, last_name, email, phone, license_number, license_expiry, salary, status) VALUES
(1, 'John', 'Doe', 'john.doe@example.com', '555-1234', '1234-5678', '2025-06-30', 75000.00, 'Active'),
(2, 'Jane', 'Smith', 'jane.smith@example.com', '555-5678', '9876-5432', '2024-12-31', 80000.00, 'Active'),
(3, 'Bob', 'Johnson', 'bob.johnson@example.com', '555-7890', '3456-7890', '2023-09-30', 70000.00, 'Inactive'),
(4, 'Alice', 'Lee', 'alice.lee@example.com', '555-2345', '5678-1234', '2024-03-31', 85000.00, 'Active'),
(5, 'David', 'Nguyen', 'david.nguyen@example.com', '555-5678', '1234-5678', '2023-12-31', 75000.00, 'Active'),
(6, 'Maria', 'Garcia', 'maria.garcia@example.com', '555-7890', '9876-5432', '2024-06-30', 70000.00, 'Active'),
(7, 'Mohammed', 'Ali', 'mohammed.ali@example.com', '555-2345', '3456-7890', '2025-09-30', 85000.00, 'Inactive'),
(8, 'Sofia', 'Martinez', 'sofia.martinez@example.com', '555-3456', '5678-1234', '2022-03-31', 80000.00, 'Active');

INSERT INTO airplanes (id, name, type, manufacturer, capacity, status, location) VALUES 
(1, 'Boeing 747', 'Jet', 'Boeing', 660, 'Active', 'Los Angeles'),
(2, 'Airbus A320', 'Jet', 'Airbus', 180, 'Active', 'New York'),
(3, 'Embraer E175', 'Jet', 'Embraer', 78, 'Inactive', 'Miami'),
(4, 'Boeing 737', 'Jet', 'Boeing', 160, 'Active', 'Chicago'),
(5, 'Airbus A330', 'Jet', 'Airbus', 440, 'Active', 'Paris'),
(6, 'Bombardier CRJ900', 'Jet', 'Bombardier', 88, 'Active', 'Montreal'),
(7, 'Boeing 777', 'Jet', 'Boeing', 396, 'Inactive', 'London'),
(8, 'Airbus A380', 'Jet', 'Airbus', 853, 'Active', 'Dubai'),
(9, 'Embraer E190', 'Jet', 'Embraer', 114, 'Active', 'Buenos Aires'),
(10, 'Boeing 787', 'Jet', 'Boeing', 335, 'Active', 'Tokyo'),
(11, 'Boeing 747-8', 'Jet', 'Boeing', 605, 'Active', 'Hong Kong'),
(12, 'Airbus A350', 'Jet', 'Airbus', 440, 'Active', 'Dublin'),
(13, 'Embraer E195', 'Jet', 'Embraer', 124, 'Inactive', 'Rio de Janeiro'),
(14, 'Boeing 737 MAX', 'Jet', 'Boeing', 230, 'Active', 'Seattle'),
(15, 'Airbus A321', 'Jet', 'Airbus', 236, 'Active', 'Shanghai');

INSERT INTO airlines (id, name, code, logo) VALUES 
(1, 'Delta Air Lines', 'DL', 'https://www.delta.com/content/dam/delta-com/brand-icons/Delta_Icon_blue_72.png'),
(2, 'American Airlines', 'AA', 'https://www.aa.com/content/dam/aa-com/logo-web/aa-logo-blue-and-red-horz.png'),
(3, 'United Airlines', 'UA', 'https://www.united.com/web/en-US/content/images/global/header/header-united-logo.png'),
(4, 'Southwest Airlines', 'WN', 'https://www.southwest.com/etc/designs/southwest/v2/images/swa-logo--mod.svg'),
(5, 'Alaska Airlines', 'AS', 'https://www.alaskaair.com/content/dam/alaskaair/logo/2016/alaska-airlines-horiz-white-blue-1x.png'),
(6, 'JetBlue Airways', 'B6', 'https://www.jetblue.com/etc/designs/jetblue/clientlibs/dist/images/svg/jetblue-logo.svg'),
(7, 'Spirit Airlines', 'NK', 'https://www.spirit.com/images/spirit-logo.png'),
(8, 'Frontier Airlines', 'F9', 'https://www.flyfrontier.com/etc/designs/frontier-airlines/clientlibs/dist/images/f9-logo-horz.svg'),
(9, 'Air France', 'AF', 'https://www.airfrance.com/etc/designs/airfrance/clientlibs/dist/images/global/logo/airfrance-logo-blue.svg'),
(10, 'Transavia France', 'TO', 'https://www.transavia.com/content/dam/airlines/tv/fra/fr/common/img/logo.svg'),
(11, 'EasyJet France', 'U2', 'https://www.easyjet.com/etc/designs/easyjet/clientlibs/dist/images/logo.svg'),
(12, 'Corsair International', 'SS', 'https://www.corsair.fr/etc/designs/corsair/clientlibs/dist/images/logo.svg'),
(13, 'XL Airways France', 'SE', 'https://www.xl.com/assets/images/XL-logo.png'),
(14, 'Aigle Azur', 'ZI', 'https://www.aigle-azur.com/site/sites/all/themes/aigle-azur/images/logo-aigle-azur-160x80.png');

INSERT INTO airports (id, name, code, city, country, latitude, longitude) VALUES
(1, 'John F. Kennedy International Airport', 'JFK', 'New York', 'United States', 40.6413, -73.7781),
(2, 'Los Angeles International Airport', 'LAX', 'Los Angeles', 'United States', 33.9416, -118.4085),
(3, 'London Heathrow Airport', 'LHR', 'London', 'United Kingdom', 51.4700, -0.4543),
(4, 'Paris-Charles de Gaulle Airport', 'CDG', 'Paris', 'France', 49.0097, 2.5479),
(5, 'Tokyo Haneda Airport', 'HND', 'Tokyo', 'Japan', 35.5532, 139.7818),
(6, 'Dubai International Airport', 'DXB', 'Dubai', 'United Arab Emirates', 25.2528, 55.3644),
(7, 'Sydney Kingsford Smith Airport', 'SYD', 'Sydney', 'Australia', -33.9461, 151.1772),
(8, 'São Paulo-Guarulhos International Airport', 'GRU', 'São Paulo', 'Brazil', -23.4356, -46.4731),
(9, 'Jomo Kenyatta International Airport', 'NBO', 'Nairobi', 'Kenya', -1.3192, 36.9258),
(10, 'Cairo International Airport', 'CAI', 'Cairo', 'Egypt', 30.1111, 31.4139),
(11, 'Paris Orly Airport', 'ORY', 'Paris', 'France', 48.7262, 2.3650),
(12, 'Nice Côte d''Azur Airport', 'NCE', 'Nice', 'France', 43.6584, 7.2157),
(13, 'Marseille Provence Airport', 'MRS', 'Marseille', 'France', 43.4393, 5.2214),
(14, 'Lyon-Saint-Exupéry Airport', 'LYS', 'Lyon', 'France', 45.7216, 5.0790),
(15, 'Bordeaux-Mérignac Airport', 'BOD', 'Bordeaux', 'France', 44.8283, -0.7156),
(16, 'Toulouse-Blagnac Airport', 'TLS', 'Toulouse', 'France', 43.6356, 1.3678),
(17, 'Nantes Atlantique Airport', 'NTE', 'Nantes', 'France', 47.1567, -1.6114),
(18, 'Strasbourg Airport', 'SXB', 'Strasbourg', 'France', 48.5442, 7.6277),
(19, 'Lille Airport', 'LIL', 'Lille', 'France', 50.5633, 3.0897),
(20, 'Brest Bretagne Airport', 'BES', 'Brest', 'France', 48.4472, -4.4228),
(21, 'Vienna International Airport', 'VIE', 'Vienna', 'Austria', 48.1197, 16.5667),
(22, 'Zürich Airport', 'ZRH', 'Zürich', 'Switzerland', 47.4502, 8.5618),
(23, 'Amsterdam Airport Schiphol', 'AMS', 'Amsterdam', 'Netherlands', 52.3081, 4.7642),
(24, 'Frankfurt Airport', 'FRA', 'Frankfurt', 'Germany', 50.0379, 8.5622),
(25, 'Barcelona-El Prat Airport', 'BCN', 'Barcelona', 'Spain', 41.2974, 2.0833),
(26, 'Adolfo Suárez Madrid-Barajas Airport', 'MAD', 'Madrid', 'Spain', 40.4936, -3.5668),
(27, 'Leonardo da Vinci-Fiumicino Airport', 'FCO', 'Rome', 'Italy', 41.8003, 12.2388),
(28, 'Stockholm Arlanda Airport', 'ARN', 'Stockholm', 'Sweden', 59.6519, 17.9186);

INSERT INTO flights (id, airline_id, pilot_id, flight_no, origin_id, destination_id, departure_time, arrival_time, duration_minutes, price_economy, price_business, price_first_class, status) VALUES
(1, 1, 1, 'BA123', 1, 2, '2023-03-15 08:00:00', '2023-03-15 10:00:00', 120, 100, 200, 300, 'scheduled'),
(2, 2, 2, 'AF456', 2, 3, '2023-03-16 14:00:00', '2023-03-16 16:30:00', 150, 80, 150, 250, 'scheduled'),
(3, 3, 3, 'LH789', 4, 5, '2023-03-17 09:30:00', '2023-03-17 12:00:00', 150, 90, 170, 280, 'scheduled'),
(4, 1, 4, 'BA345', 2, 5, '2023-03-18 07:00:00', '2023-03-18 10:00:00', 180, 120, 240, 400, 'scheduled'),
(5, 4, 5, 'EZY678', 3, 1, '2023-03-19 11:00:00', '2023-03-19 13:00:00', 120, 60, 120, 200, 'scheduled'),
(6, 2, 6, 'AF901', 5, 6, '2023-03-20 16:30:00', '2023-03-20 19:00:00', 150, 100, 200, 350, 'scheduled');

INSERT INTO `user_type_permissions` (`user_type_id`, `permission_id`) VALUES 
('6', '1'),('6', '2'),('6', '3'),('6', '4'),('6', '5'),('6', '6'),('6', '7'),('6', '8'),('6', '9'),('6', '10'),('6', '11'),('6', '12'),('6', '13'),('6', '14'),('6', '15'),('6', '16'),('6', '17'),('6', '18'),('6', '19'),('6', '20'),('6', '21'),('6', '22'),('6', '23'),('6', '24'),('6', '25'),('6', '26'),('6', '27'),('6', '28');