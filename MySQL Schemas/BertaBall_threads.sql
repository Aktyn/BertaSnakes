-- MySQL dump 10.13  Distrib 5.7.23, for Linux (x86_64)
--
-- Host: localhost    Database: BertaBall
-- ------------------------------------------------------
-- Server version	5.7.23-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `threads`
--

DROP TABLE IF EXISTS `threads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `threads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author_id` int(11) NOT NULL,
  `category` int(3) DEFAULT NULL,
  `subject` varchar(128) NOT NULL,
  `time` char(16) DEFAULT NULL,
  `last_post_time` char(16) DEFAULT NULL,
  `total_posts` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `threads`
--

LOCK TABLES `threads` WRITE;
/*!40000 ALTER TABLE `threads` DISABLE KEYS */;
INSERT INTO `threads` VALUES (1,2,1,'News of the year','2018-08-25 00:57','2018-08-25 12:46',2),(2,13,1,'another thread','2018-08-25 12:32','2018-08-25 13:06',6),(3,13,3,'Help me pleez','2018-08-25 13:13','2018-08-30 20:00',22),(4,13,3,'gdfgdfg','2018-08-25 13:13','2018-08-25 13:13',1),(5,13,3,'gdgdfgdf','2018-08-25 13:13','2018-08-25 13:13',1),(6,13,3,'time is a construct','2018-08-25 13:14','2018-08-25 17:25',3),(7,13,3,'111','2018-08-25 13:27','2018-08-25 13:27',1),(8,13,3,'222','2018-08-25 13:28','2018-08-25 13:52',2),(9,13,3,'333','2018-08-25 13:28','2018-08-25 13:32',2),(10,13,3,'444','2018-08-25 13:40','2018-08-25 20:34',6),(11,13,3,'555','2018-08-25 13:40','2018-08-25 13:45',4),(13,3,3,'moderator thread','2018-08-25 14:43','2018-08-25 14:43',1),(14,3,3,'gdfgdfg','2018-08-25 14:56','2018-08-25 14:56',1),(15,3,3,'gdfgdfg','2018-08-25 14:56','2018-08-25 14:56',1),(16,13,1,'new news','2018-08-26 19:38','2018-09-29 15:13',4),(17,13,1,'Newest news','2018-08-26 21:55','2018-09-29 15:18',3);
/*!40000 ALTER TABLE `threads` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-03 20:26:20
