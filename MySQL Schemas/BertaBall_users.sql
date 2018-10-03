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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(64) CHARACTER SET utf8 NOT NULL,
  `password` varchar(256) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `register_hash` varchar(256) DEFAULT NULL,
  `session_key` varchar(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `ip` varchar(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `register_date` char(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `last_login` char(16) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `rank` int(10) NOT NULL DEFAULT '1000',
  `custom_data` varchar(2048) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `friends` varchar(2048) DEFAULT '[]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Aktyn','/58w2bpaTsOG7d3qzCf3TvQSCF4=','no@zupa.pl','verified','E+xAoXmnyOb/Shk/Q0ZiF61YlJr0BJDgUh1WJwkpkAQ=','127.0.0.1','2018-06-28 17:09','2018-09-22 00:10',1016,'{\"level\":4,\"exp\":0.7906666666666667,\"coins\":176,\"ship_type\":1,\"avaible_ships\":[0,1],\"rank\":1016.885934654495,\"skills\":[null,null,null,null,null,null],\"avaible_skills\":[]}','[{\"id\":13,\"nick\":\"Rzopex\"},{\"id\":10,\"nick\":\"Pablo\"}]'),(2,'Admin','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn0@gmail.com','verified','13DcxtYnClHWptDZrF2nZfM5KXXeOijfmQv7DFT5Fwc=','::1','2018-06-28 17:51','2018-10-02 00:05',995,'{\"level\":1,\"exp\":0.05199999999999999,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0],\"rank\":995,\"skills\":[null,null,null,null,null,null],\"avaible_skills\":[]}','[]'),(3,'Moderator','tH2Ss+0vjya/ifJBOuqiGIlBFs0=','Aktyn5435@gmail.com','verified',NULL,'::1','2018-06-28 17:56','2018-08-26 18:49',1000,'{\"level\":1,\"exp\":0.09,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0],\"rank\":1000,\"skills\":[null,null,null,null,null,null],\"avaible_skills\":[]}','[]'),(4,'root','88PoPRwDmPpKl/yVbGdcssTCWZ0=','nope@gdfg.ccc','verified',NULL,'::1','2018-06-28 17:58','2018-08-18 23:57',1353,'{\"level\":1,\"exp\":0,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0]}','[]'),(5,'Ignorowiec','/58w2bpaTsOG7d3qzCf3TvQSCF4=','bambuko@gmail.ciom','banned',NULL,'::1','2018-06-28 21:11','2018-07-15 13:13',1080,'{\"level\":1,\"exp\":0,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0]}','[]'),(10,'Pablo','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn69@gmail.com','verified',NULL,'::1','2018-08-11 19:09','2018-09-28 11:41',1098,'{\"level\":15,\"exp\":0.2887483753727928,\"coins\":14331,\"ship_type\":2,\"avaible_ships\":[0,1,2],\"rank\":1098.750383327437,\"skills\":[5,6,3,4,8,7],\"avaible_skills\":[4,3,5,6,7,8]}','[{\"id\":1,\"nick\":\"Aktyn\"},{\"id\":13,\"nick\":\"Rzopex\"}]'),(11,'plastus','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn70@gmail.com','verified',NULL,'::1','2018-08-11 19:27','2018-08-11 22:29',567,'{\"level\":1,\"exp\":0,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0]}','[]'),(12,'Kupniako','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn71@gmail.com','verified',NULL,'::1','2018-08-11 22:51','2018-08-12 00:33',646,'{\"level\":1,\"exp\":0,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0]}','[]'),(13,'Rzopex','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn72@gmail.com','verified',NULL,'::1','2018-08-12 00:35','2018-09-24 13:41',1009,'{\"level\":5,\"exp\":0.49541122853607733,\"coins\":420,\"ship_type\":1,\"avaible_ships\":[0,1],\"rank\":1009.3461765452718,\"avaible_skills\":[3,4],\"skills\":[4,3,null,null,null,null]}','[{\"id\":1,\"nick\":\"Aktyn\"},{\"id\":10,\"nick\":\"Pablo\"}]'),(14,'sonocowiec','/58w2bpaTsOG7d3qzCf3TvQSCF4=','Aktyn30@gmail.com','verified',NULL,'::1','2018-08-18 23:56','2018-08-21 19:08',1000,'{\"level\":1,\"exp\":0.04,\"coins\":0,\"ship_type\":0,\"avaible_ships\":[0],\"rank\":1000}','[]');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
