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
-- Table structure for table `chat_dataset`
--

DROP TABLE IF EXISTS `chat_dataset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_dataset` (
  `id_chat` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` varchar(16) NOT NULL DEFAULT '0',
  `from` varchar(64) DEFAULT NULL,
  `to` varchar(64) DEFAULT NULL,
  `message` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id_chat`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_dataset`
--

LOCK TABLES `chat_dataset` WRITE;
/*!40000 ALTER TABLE `chat_dataset` DISABLE KEYS */;
INSERT INTO `chat_dataset` VALUES (1,'1535538345427','Pablo','Aktyn','ech'),(2,'1535538357282','Pablo','Aktyn','och'),(3,'1535538360091','Pablo','Aktyn','i ach'),(4,'1535538376482','Aktyn','Pablo','no czesc'),(5,'1535538379945','Pablo','Aktyn','siemaneczko'),(6,'1535538414401','Aktyn','Pablo','lubisz delta szwagron super cool komando wilkow alfa?'),(7,'1535538420592','Pablo','Aktyn','no oczywiscie'),(8,'1535538424437','Pablo','Aktyn','ze nie'),(9,'1535538530566','Aktyn','Pablo','no Tomasz Problem'),(10,'1535828191506','Pablo','Aktyn','nab'),(11,'1535828221946','Aktyn','Pablo','hypa ty'),(12,'1535884151010','Pablo','Aktyn','rzal'),(13,'1535884304509','Aktyn','Pablo','faf'),(14,'1535884384131','Aktyn','Pablo','avada kedavra'),(15,'1535884508864','Aktyn','Pablo','gdfgfd'),(16,'1535884559270','Aktyn','Pablo','fdsfsdf'),(17,'1535884952092','Aktyn','Pablo','gdfg'),(18,'1535885110246','Aktyn','Pablo','gdfg'),(19,'1535885128593','Pablo','Aktyn','dasd'),(20,'1535885153764','Pablo','Aktyn','adasd'),(21,'1535885368837','Pablo','Guest#1001','lrel'),(22,'1535885373380','Guest#1001','Pablo','nom'),(23,'1535885472873','Pablo','Guest#1002','gdfg'),(24,'1535885477937','Guest#1002','Pablo','yep'),(25,'1535927989491','Aktyn','Pablo','nab'),(26,'1536434781849','Pablo','Rzopex','nub'),(27,'1536434787687','Rzopex','Pablo','hypa ty'),(28,'1536954768381','Aktyn','Pablo','nob'),(29,'1536954776916','Aktyn','Pablo','hah'),(30,'1536954777060','Aktyn','Pablo','a'),(31,'1536954777164','Aktyn','Pablo','h'),(32,'1536954777270','Aktyn','Pablo','a'),(33,'1536954777380','Aktyn','Pablo','ha'),(34,'1536954871145','Aktyn','Pablo','jgj'),(35,'1537556943198','Admin','Guest#1005','Nob'),(36,'1537556950697','Guest#1005','Admin','hypa ty');
/*!40000 ALTER TABLE `chat_dataset` ENABLE KEYS */;
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
