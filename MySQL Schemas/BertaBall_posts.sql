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
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author_id` int(11) NOT NULL,
  `thread_id` int(11) NOT NULL,
  `time` char(16) DEFAULT NULL,
  `content` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,2,1,'2018-08-25 00:57','Forum exists'),(2,13,2,'2018-08-25 12:32','hmhmhm'),(3,13,2,'2018-08-25 12:32','agreeeeeeeeeeeeeeeeeeeeeeeeee'),(4,13,2,'2018-08-25 12:32','gfd g dfg dfg df'),(5,13,1,'2018-08-25 12:46','Is it?'),(6,13,2,'2018-08-25 12:47','yep'),(7,13,2,'2018-08-25 13:03','g\ndfg\ndf\ng\ndf\ngdfggf\ndf\ngdfgdfgdf\ng\ndf\ngd\nfg\ndf\ngdfgdg'),(8,13,2,'2018-08-25 13:06','Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?'),(9,13,3,'2018-08-25 13:13','i dont know what to say'),(10,13,3,'2018-08-25 13:13','hfgh\nfg\nh\nfg\nhfghhfghfgh'),(11,13,3,'2018-08-25 13:13','hfhfgh'),(12,13,3,'2018-08-25 13:13','hfghfghgfh'),(13,13,3,'2018-08-25 13:13','hfghgfhfghfgh'),(14,13,3,'2018-08-25 13:13','gdfgdfgdfg'),(15,13,4,'2018-08-25 13:13','gdfgg'),(16,13,5,'2018-08-25 13:13','gdfgdfgfdgg'),(17,13,6,'2018-08-25 13:14','hfghfghfgh'),(18,13,6,'2018-08-25 13:17','biacz'),(19,13,7,'2018-08-25 13:27','fsdfsdf'),(20,13,8,'2018-08-25 13:28','fsdfsdf'),(21,13,9,'2018-08-25 13:28','fsdfsdfsf'),(22,13,9,'2018-08-25 13:32','sgdfg'),(23,13,10,'2018-08-25 13:40','dfggdfg'),(24,13,11,'2018-08-25 13:40','dfgdfgd'),(25,13,11,'2018-08-25 13:40','hgfh'),(26,13,11,'2018-08-25 13:40','rzdh'),(27,13,11,'2018-08-25 13:45','hfg'),(28,13,3,'2018-08-25 13:50','hfghfgh'),(29,13,8,'2018-08-25 13:52','rzop'),(30,3,13,'2018-08-25 14:43','gdfgdfgdfg'),(31,3,10,'2018-08-25 14:44','ehhh'),(32,3,14,'2018-08-25 14:56','dfgdfg'),(33,3,15,'2018-08-25 14:56','dfgdfgdfg'),(34,3,6,'2018-08-25 17:25','Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?'),(35,3,3,'2018-08-25 18:53','hmmmm'),(36,3,3,'2018-08-25 18:53','ksdfsf'),(37,3,3,'2018-08-25 18:53','fsdfsd'),(38,3,3,'2018-08-25 18:53','endddddd'),(39,3,10,'2018-08-25 20:33','gdfg'),(40,3,10,'2018-08-25 20:33','gdfg'),(41,3,10,'2018-08-25 20:33','gfdg'),(42,3,10,'2018-08-25 20:34','jhgjhgj'),(43,13,16,'2018-08-26 19:38','blablablabla'),(44,13,16,'2018-08-26 20:47','yeo'),(45,13,16,'2018-08-26 20:47','thats new'),(46,13,17,'2018-08-26 21:55','Those news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. '),(47,13,17,'2018-08-26 21:56','agreee'),(48,10,3,'2018-08-30 19:59','gfdg'),(49,10,3,'2018-08-30 19:59','bvcbcvb'),(50,10,3,'2018-08-30 19:59','fsdfsdf,'),(51,10,3,'2018-08-30 19:59','fsdf sd,\n,'),(52,10,3,'2018-08-30 19:59','fsdfsdfsdfsf'),(53,10,3,'2018-08-30 19:59','dasdasd a a d'),(54,10,3,'2018-08-30 19:59','AVADA KEDAVRA'),(55,10,3,'2018-08-30 19:59','huh'),(56,10,3,'2018-08-30 19:59','rzopsko'),(57,10,3,'2018-08-30 20:00','SUPRICE MADAFAKAAAAA'),(58,2,16,'2018-09-29 15:13','hmmmm recent post'),(59,2,17,'2018-09-29 15:18','--- NEW ---\nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news. \nThose news are the newest news. Those news are the newest news. Those news are the newest news.');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
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
