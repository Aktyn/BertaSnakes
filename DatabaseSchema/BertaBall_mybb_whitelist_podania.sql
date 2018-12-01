CREATE DATABASE  IF NOT EXISTS `BertaBall` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `BertaBall`;
-- MySQL dump 10.13  Distrib 5.7.24, for Linux (x86_64)
--
-- Host: localhost    Database: BertaBall
-- ------------------------------------------------------
-- Server version	5.7.24-0ubuntu0.18.10.1

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
-- Table structure for table `mybb_whitelist_podania`
--

DROP TABLE IF EXISTS `mybb_whitelist_podania`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mybb_whitelist_podania` (
  `user` varchar(45) NOT NULL,
  `timestamp` varchar(45) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL,
  `discord` varchar(45) DEFAULT NULL,
  `data_urodzenia` varchar(45) DEFAULT NULL,
  `co_wiesz_o_rp` varchar(512) DEFAULT NULL,
  `rp_doswiadczenie` varchar(512) DEFAULT NULL,
  `postacie` varchar(512) DEFAULT NULL,
  `link_do_kanalu` varchar(512) DEFAULT NULL,
  `akcja1` varchar(512) DEFAULT NULL,
  `akcja2` varchar(512) DEFAULT NULL,
  `akcja3` varchar(512) DEFAULT NULL,
  `akcja4` varchar(512) DEFAULT NULL,
  `power_gaming` varchar(512) DEFAULT NULL,
  `poscig_uliczny` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-11-25 23:22:04
