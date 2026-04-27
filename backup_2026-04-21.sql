-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: Agri_ERP_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `abonnements_historique`
--

DROP TABLE IF EXISTS `abonnements_historique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `abonnements_historique` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `plan_precedent` varchar(20) NOT NULL,
  `plan_nouveau` varchar(20) NOT NULL,
  `montant_fcfa` decimal(12,2) DEFAULT NULL,
  `processeur_paiement` varchar(30) DEFAULT NULL,
  `reference_paiement` varchar(200) DEFAULT NULL,
  `statut` enum('en_attente','paye','echoue','rembourse','confirme') NOT NULL DEFAULT 'en_attente',
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `abonnements_historique_organisation_id_index` (`organisation_id`),
  KEY `abonnements_historique_reference_paiement_index` (`reference_paiement`),
  CONSTRAINT `abonnements_historique_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abonnements_historique`
--

LOCK TABLES `abonnements_historique` WRITE;
/*!40000 ALTER TABLE `abonnements_historique` DISABLE KEYS */;
/*!40000 ALTER TABLE `abonnements_historique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alertes_culturales`
--

DROP TABLE IF EXISTS `alertes_culturales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alertes_culturales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `culture_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `alertes_culturales_culture_id_type_unique` (`culture_id`,`type`),
  KEY `alertes_culturales_user_id_foreign` (`user_id`),
  CONSTRAINT `alertes_culturales_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alertes_culturales_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertes_culturales`
--

LOCK TABLES `alertes_culturales` WRITE;
/*!40000 ALTER TABLE `alertes_culturales` DISABLE KEYS */;
/*!40000 ALTER TABLE `alertes_culturales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `model_type` varchar(100) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_organisation_id_index` (`organisation_id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  KEY `audit_logs_model_type_model_id_index` (`model_type`,`model_id`),
  CONSTRAINT `audit_logs_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campagnes_agricoles`
--

DROP TABLE IF EXISTS `campagnes_agricoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campagnes_agricoles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `nom` varchar(100) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `est_courante` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `campagnes_agricoles_organisation_id_index` (`organisation_id`),
  KEY `campagnes_agricoles_est_courante_index` (`est_courante`),
  CONSTRAINT `campagnes_agricoles_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campagnes_agricoles`
--

LOCK TABLES `campagnes_agricoles` WRITE;
/*!40000 ALTER TABLE `campagnes_agricoles` DISABLE KEYS */;
INSERT INTO `campagnes_agricoles` VALUES (1,1,'Campagne 2025-2026','2025-10-01','2026-09-30',1,NULL,'2026-04-19 01:30:08','2026-04-19 01:30:08');
/*!40000 ALTER TABLE `campagnes_agricoles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories_depenses`
--

DROP TABLE IF EXISTS `categories_depenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories_depenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `nom` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_depenses_organisation_id_slug_unique` (`organisation_id`,`slug`),
  CONSTRAINT `categories_depenses_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories_depenses`
--

LOCK TABLES `categories_depenses` WRITE;
/*!40000 ALTER TABLE `categories_depenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories_depenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `champs`
--

DROP TABLE IF EXISTS `champs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `champs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `nom` varchar(150) NOT NULL,
  `superficie_ha` decimal(10,4) NOT NULL,
  `localisation` varchar(300) DEFAULT NULL,
  `zone_meteo` enum('dakar_niayes','thies','louga','saint_louis','podor','dagana','kaolack','ziguinchor','tambacounda') DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `champs_user_id_foreign` (`user_id`),
  KEY `champs_organisation_id_index` (`organisation_id`),
  KEY `champs_organisation_id_est_actif_index` (`organisation_id`,`est_actif`),
  CONSTRAINT `champs_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `champs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `champs`
--

LOCK TABLES `champs` WRITE;
/*!40000 ALTER TABLE `champs` DISABLE KEYS */;
INSERT INTO `champs` VALUES (1,1,2,'Yokh',0.0000,NULL,NULL,NULL,NULL,NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46',NULL),(2,1,2,'Ablaye Fall',0.0000,NULL,NULL,NULL,NULL,NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46',NULL),(3,1,2,'Razel',0.0000,NULL,NULL,NULL,NULL,NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46',NULL),(4,1,2,'Projet',0.0000,NULL,NULL,NULL,NULL,NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46',NULL);
/*!40000 ALTER TABLE `champs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cultures`
--

DROP TABLE IF EXISTS `cultures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cultures` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `champ_id` bigint(20) unsigned NOT NULL,
  `campagne_id` bigint(20) unsigned DEFAULT NULL,
  `nom` varchar(150) NOT NULL,
  `type_culture` enum('oignon','tomate','riz','courgette','piment','patate','pasteque','melon','concombre','fraisier','autre') DEFAULT NULL,
  `variete` varchar(100) DEFAULT NULL,
  `saison` enum('normale','contre_saison') NOT NULL,
  `annee` year(4) NOT NULL,
  `date_semis` date DEFAULT NULL,
  `date_recolte_prevue` date DEFAULT NULL,
  `date_recolte_effective` date DEFAULT NULL,
  `superficie_cultivee_ha` decimal(10,4) DEFAULT NULL,
  `quantite_recoltee_kg` decimal(12,2) DEFAULT NULL,
  `statut` enum('en_cours','recolte','termine','abandonne') NOT NULL DEFAULT 'en_cours',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cultures_organisation_id_index` (`organisation_id`),
  KEY `cultures_champ_id_index` (`champ_id`),
  KEY `cultures_campagne_id_index` (`campagne_id`),
  KEY `cultures_organisation_id_statut_index` (`organisation_id`,`statut`),
  CONSTRAINT `cultures_campagne_id_foreign` FOREIGN KEY (`campagne_id`) REFERENCES `campagnes_agricoles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cultures_champ_id_foreign` FOREIGN KEY (`champ_id`) REFERENCES `champs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cultures_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cultures`
--

LOCK TABLES `cultures` WRITE;
/*!40000 ALTER TABLE `cultures` DISABLE KEYS */;
/*!40000 ALTER TABLE `cultures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `depenses`
--

DROP TABLE IF EXISTS `depenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `depenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `champ_id` bigint(20) unsigned DEFAULT NULL,
  `campagne_id` bigint(20) unsigned DEFAULT NULL,
  `categorie` enum('intrant','salaire','materiel','autre','carburant','main_oeuvre','traitement_phytosanitaire','transport','irrigation','entretien_materiel','alimentation_betail','frais_recolte','financement_individuel') NOT NULL,
  `description` varchar(300) NOT NULL,
  `montant_fcfa` decimal(14,2) NOT NULL,
  `date_depense` date NOT NULL,
  `est_auto_generee` tinyint(1) NOT NULL DEFAULT 0,
  `source_type` varchar(50) DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `depenses_user_id_foreign` (`user_id`),
  KEY `depenses_organisation_id_index` (`organisation_id`),
  KEY `depenses_champ_id_index` (`champ_id`),
  KEY `depenses_campagne_id_index` (`campagne_id`),
  KEY `depenses_organisation_id_date_depense_index` (`organisation_id`,`date_depense`),
  KEY `depenses_source_type_source_id_index` (`source_type`,`source_id`),
  CONSTRAINT `depenses_campagne_id_foreign` FOREIGN KEY (`campagne_id`) REFERENCES `campagnes_agricoles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `depenses_champ_id_foreign` FOREIGN KEY (`champ_id`) REFERENCES `champs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `depenses_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `depenses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=300 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `depenses`
--

LOCK TABLES `depenses` WRITE;
/*!40000 ALTER TABLE `depenses` DISABLE KEYS */;
INSERT INTO `depenses` VALUES (1,1,2,2,NULL,'traitement_phytosanitaire','traitement Ablaye Fall',13500.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(2,1,2,1,NULL,'traitement_phytosanitaire','traitement yokhe Selec',40000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(3,1,2,NULL,NULL,'autre','Dépenses diverses',2500.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(4,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(5,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre 0,90 ha',54000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(6,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre 0,55 ha',33000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(7,1,2,NULL,NULL,'main_oeuvre','Dépenses répigage 2jr',10000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(8,1,2,2,NULL,'carburant','Gazoil Ablay',10000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(9,1,2,2,NULL,'carburant','Gazoil Ablaye',10000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(10,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(11,1,2,1,NULL,'traitement_phytosanitaire','traitement yokhe',27000.00,'2025-10-01',0,NULL,NULL,NULL,NULL,NULL),(12,1,2,NULL,NULL,'carburant','Essence tricycle',13000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(13,1,2,2,NULL,'autre','Dépenses Ablay Tlb 2j',10000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(14,1,2,1,NULL,'autre','Dépenses yokhe Bay',40000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(15,1,2,4,NULL,'carburant','Gazoil projet',10000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(16,1,2,4,NULL,'main_oeuvre','Coup-coup projet',4000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(17,1,2,NULL,NULL,'carburant','Essence tricycle',5000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(18,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre Tlb',44000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(19,1,2,2,NULL,'autre','Dépenses Tlb Ablay',5000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(20,1,2,NULL,NULL,'entretien_materiel','Entretien tricycle',6000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(21,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(22,1,2,1,NULL,'carburant','Gazoil yokhe',10000.00,'2025-10-15',0,NULL,NULL,NULL,NULL,NULL),(23,1,2,1,NULL,'autre','Dépenses Ablay Yokhe',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(24,1,2,NULL,NULL,'carburant','Essence tricycle',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(25,1,2,1,NULL,'carburant','Gazoil yokhe',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(26,1,2,NULL,NULL,'autre','Dépenses diverses',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(27,1,2,NULL,NULL,'entretien_materiel','Moto pompe',12000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(28,1,2,1,NULL,'main_oeuvre','Ripage tomates yokhe',9000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(29,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(30,1,2,NULL,NULL,'main_oeuvre','Moto pompe + main-d\'oeuvre',15000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(31,1,2,1,NULL,'carburant','Gazoil yokhe',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(32,1,2,3,NULL,'traitement_phytosanitaire','Traitement Razel',17000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(33,1,2,3,NULL,'main_oeuvre','Journalier Razel',12500.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(34,1,2,3,NULL,'carburant','Essence moto Razel',12000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(35,1,2,3,NULL,'alimentation_betail','Aliment rakal Razel',10000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(36,1,2,3,NULL,'autre','Mode fouk Razel',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(37,1,2,3,NULL,'main_oeuvre','Journalier Razel',10000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(38,1,2,3,NULL,'traitement_phytosanitaire','Traitement Razel',20000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(39,1,2,3,NULL,'carburant','Essence Razel',12000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(40,1,2,3,NULL,'autre','Dépenses Razel',4000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(41,1,2,3,NULL,'main_oeuvre','Talibé répigage Razel',15000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(42,1,2,3,NULL,'carburant','Essence moto Razel',5000.00,'2025-11-01',0,NULL,NULL,NULL,NULL,NULL),(43,1,2,NULL,NULL,'entretien_materiel','Moto pompe',17000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(44,1,2,NULL,NULL,'autre','Dépenses diverses',3000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(45,1,2,1,NULL,'carburant','Essence yokhe',5000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(46,1,2,NULL,NULL,'autre','Marabout Sarah',35000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(47,1,2,NULL,NULL,'transport','Transport engrais',20000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(48,1,2,NULL,NULL,'transport','Transport engrais',20000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(49,1,2,1,NULL,'traitement_phytosanitaire','Traitement yokhe',20000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(50,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablaye',5000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(51,1,2,NULL,NULL,'autre','Dépenses diverses',3000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(52,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablaye',14000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(53,1,2,NULL,NULL,'entretien_materiel','Dépenage moto',32500.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(54,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablaye Fall',20000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(55,1,2,NULL,NULL,'autre','Marabout sarax',3500.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(56,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-11-15',0,NULL,NULL,NULL,NULL,NULL),(57,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(58,1,2,4,NULL,'carburant','Gazoil projet',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(59,1,2,NULL,NULL,'alimentation_betail','Aliment rakal',20000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(60,1,2,1,NULL,'carburant','Gazoil yokhe',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(61,1,2,2,NULL,'carburant','Gazoil Ablaye',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(62,1,2,2,NULL,'carburant','Gazoil Ablaye Fall',7000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(63,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(64,1,2,1,NULL,'traitement_phytosanitaire','Traitement yokhe safir',30000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(65,1,2,NULL,NULL,'entretien_materiel','Assane mécanicien',7000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(66,1,2,NULL,NULL,'alimentation_betail','40 litres aliment',14000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(67,1,2,NULL,NULL,'autre','Dépenses diverses',5000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(68,1,2,1,NULL,'carburant','Gazoil yokhe',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(69,1,2,2,NULL,'carburant','Gazoil Ablay',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(70,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-12-01',0,NULL,NULL,NULL,NULL,NULL),(71,1,2,4,NULL,'carburant','Gazoil projet',5000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(72,1,2,1,NULL,'carburant','Gazoil yokhe',10000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(73,1,2,2,NULL,'carburant','Gazoil Ablay Fall',10000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(74,1,2,NULL,NULL,'entretien_materiel','Huile moto pompe',4000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(75,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(76,1,2,NULL,NULL,'traitement_phytosanitaire','Safir plus Slec traitement',22000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(77,1,2,NULL,NULL,'autre','Dépenses diverses',5000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(78,1,2,1,NULL,'carburant','Gazoil yokhe',8000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(79,1,2,2,NULL,'carburant','Gazoil Ablay',10000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(80,1,2,4,NULL,'carburant','Gazoil projet',5000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(81,1,2,4,NULL,'main_oeuvre','Travaux projet',48000.00,'2025-12-15',0,NULL,NULL,NULL,NULL,NULL),(82,1,2,NULL,NULL,'entretien_materiel','Entretien moto pompe',40000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(83,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre mécanicien',20000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(84,1,2,NULL,NULL,'carburant','Gazoil',3000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(85,1,2,NULL,NULL,'carburant','Essence tricycle',5000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(86,1,2,4,NULL,'carburant','Gazoil projet',5000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(87,1,2,2,NULL,'carburant','Gazoil Ablay Fall',10000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(88,1,2,1,NULL,'frais_recolte','Frais récolte yokhe',13500.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(89,1,2,2,NULL,'frais_recolte','Frais récolte Ablay',42500.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(90,1,2,NULL,NULL,'entretien_materiel','Roulement moto pompe',4000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(91,1,2,NULL,NULL,'carburant','Gazoil',10000.00,'2026-01-01',0,NULL,NULL,NULL,NULL,NULL),(92,1,2,NULL,NULL,'autre','Dépenses diverses',20000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(93,1,2,NULL,NULL,'entretien_materiel','Moto pompe',25000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(94,1,2,NULL,NULL,'main_oeuvre','Aliment ripase 10 sacs',70000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(95,1,2,NULL,NULL,'alimentation_betail','Rakal 3 sacs',30000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(96,1,2,1,NULL,'frais_recolte','Frais récolte yokhe',79000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(97,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(98,1,2,NULL,NULL,'carburant','Gazoil',15000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(99,1,2,NULL,NULL,'alimentation_betail','Rakal aliment',10000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(100,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablaye',9500.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(101,1,2,1,NULL,'traitement_phytosanitaire','Traitement yokhe',7500.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(102,1,2,NULL,NULL,'alimentation_betail','Aliment rakal',8000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(103,1,2,1,NULL,'frais_recolte','Frais récolte yokhe',36000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(104,1,2,3,NULL,'main_oeuvre','Journalier Razel',15000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(105,1,2,3,NULL,'carburant','Essence moto Razel',12000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(106,1,2,2,NULL,'carburant','Gazoil Ablay',5000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(107,1,2,3,NULL,'entretien_materiel','Entretien moto Razel',55000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(108,1,2,3,NULL,'carburant','Essence moto Razel',6000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(109,1,2,3,NULL,'carburant','Essence moto Razel',12000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(110,1,2,3,NULL,'frais_recolte','1er frais récolte Razel',11000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(111,1,2,3,NULL,'frais_recolte','2e et 3e frais récolte Razel',27000.00,'2026-01-15',0,NULL,NULL,NULL,NULL,NULL),(112,1,2,NULL,NULL,'autre','Sarah',2300.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(113,1,2,1,NULL,'traitement_phytosanitaire','Traitement yokhe',15000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(114,1,2,NULL,NULL,'autre','Dépenses diverses',4000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(115,1,2,NULL,NULL,'autre','Dépenses diakarta',13000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(116,1,2,1,NULL,'carburant','Gazoil yokhe',5000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(117,1,2,NULL,NULL,'carburant','Essence tricycle',5000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(118,1,2,NULL,NULL,'entretien_materiel','Moto pompe',4000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(119,1,2,NULL,NULL,'entretien_materiel','Entretien tricycle',4000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(120,1,2,1,NULL,'transport','Transport yokhe oignons',10000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(121,1,2,1,NULL,'main_oeuvre','Main-d\'oeuvre yokhe',51000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(122,1,2,1,NULL,'transport','Transport yokhe',15000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(123,1,2,2,NULL,'carburant','Gazoil Ablay Fall',10000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(124,1,2,NULL,NULL,'entretien_materiel','Entretien moto',15000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(125,1,2,NULL,NULL,'alimentation_betail','Rakal aliment',10000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(126,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablaye Fall Slec',40000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(127,1,2,NULL,NULL,'autre','Dépenses diverses',6000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(128,1,2,NULL,NULL,'entretien_materiel','Dépenage tricycle',32000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(129,1,2,2,NULL,'traitement_phytosanitaire','Traitement foliaire Ablay',4000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(130,1,2,1,NULL,'traitement_phytosanitaire','Traitement foliaire yokhe',8000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(131,1,2,1,NULL,'traitement_phytosanitaire','Traitement canal yokhe',6000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(132,1,2,2,NULL,'traitement_phytosanitaire','Traitement canal Ablay',6000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(133,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2026-02-01',0,NULL,NULL,NULL,NULL,NULL),(134,1,2,3,NULL,'main_oeuvre','Nettoyage citron Razel',27500.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(135,1,2,3,NULL,'main_oeuvre','Journalier tomates et oignons Razel',25000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(136,1,2,3,NULL,'traitement_phytosanitaire','Traitement citron 2L Razel',14000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(137,1,2,3,NULL,'traitement_phytosanitaire','Traitement tomates Razel',18000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(138,1,2,3,NULL,'carburant','Essence moto Razel',12000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(139,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(140,1,2,NULL,NULL,'entretien_materiel','Porte module',3000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(141,1,2,2,NULL,'carburant','Gazoil et huile Ablay',9500.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(142,1,2,4,NULL,'carburant','Gazoil projet',5000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(143,1,2,NULL,NULL,'autre','Dépenses diverses',5000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(144,1,2,NULL,NULL,'entretien_materiel','Entretien moto pompe',50500.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(145,1,2,NULL,NULL,'carburant','Essence gazoil',7000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(146,1,2,2,NULL,'carburant','Gazoil Ablay',10000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(147,1,2,1,NULL,'carburant','Gazoil yokhe',15000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(148,1,2,NULL,NULL,'autre','Dépenses diverses',4000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(149,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre entretien',15000.00,'2026-02-15',0,NULL,NULL,NULL,NULL,NULL),(150,1,2,NULL,NULL,'traitement_phytosanitaire','Titen 3 litres traitement',39000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(151,1,2,1,NULL,'traitement_phytosanitaire','Traitement yokhe safir',43000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(152,1,2,2,NULL,'traitement_phytosanitaire','Traitement Ablay safir',21000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(153,1,2,2,NULL,'traitement_phytosanitaire','Clifader traitement Ablay',6000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(154,1,2,1,NULL,'traitement_phytosanitaire','Clifader yokhe',6000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(155,1,2,NULL,NULL,'carburant','Essence tricycle',13000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(156,1,2,NULL,NULL,'main_oeuvre','Maçon',15000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(157,1,2,NULL,NULL,'materiel','Ciment 8 sacs',30400.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(158,1,2,NULL,NULL,'autre','Dépenses diverses',5000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(159,1,2,NULL,NULL,'carburant','Gazoil',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(160,1,2,NULL,NULL,'traitement_phytosanitaire','Semences tomates et traitements',14000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(161,1,2,1,NULL,'main_oeuvre','Journalier yokhe',7500.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(162,1,2,2,NULL,'main_oeuvre','Journalier Ablay',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(163,1,2,NULL,NULL,'autre','Dépenses déjeuner',3000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(164,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(165,1,2,3,NULL,'main_oeuvre','Journalier Razel répigage',20000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(166,1,2,NULL,NULL,'carburant','Essence tricycle',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(167,1,2,NULL,NULL,'entretien_materiel','Huile moteur',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(168,1,2,NULL,NULL,'entretien_materiel','3 porte module',31250.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(169,1,2,NULL,NULL,'main_oeuvre','Main-d\'oeuvre',12000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(170,1,2,NULL,NULL,'main_oeuvre','Maçon',15000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(171,1,2,NULL,NULL,'materiel','Charge sable',15000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(172,1,2,NULL,NULL,'materiel','3 barres fer 6',5300.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(173,1,2,NULL,NULL,'materiel','4 pelles',2000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(174,1,2,NULL,NULL,'autre','Dépenses diverses',3000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(175,1,2,NULL,NULL,'carburant','Gazoil',30000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(176,1,2,NULL,NULL,'carburant','Gazoil',10000.00,'2026-03-01',0,NULL,NULL,NULL,NULL,NULL),(177,1,2,3,NULL,'autre','Dépenses Razel',3000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(178,1,2,3,NULL,'entretien_materiel','Rouleau enjou + transport Razel',46000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(179,1,2,3,NULL,'materiel','Obsette Razel',65000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(180,1,2,3,NULL,'carburant','Essence Razel',6000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(181,1,2,3,NULL,'materiel','Tuyau menssion 63/50 Razel',13500.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(182,1,2,3,NULL,'materiel','Corde 64m Razel',8000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(183,1,2,3,NULL,'autre','Dépenses Razel',4000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(184,1,2,3,NULL,'main_oeuvre','Aliment ripas Razel',7000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(185,1,2,3,NULL,'main_oeuvre','Ordenace Seydou Razel',15000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(186,1,2,3,NULL,'materiel','2 van ger Razel',9000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(187,1,2,3,NULL,'carburant','Essence Razel',6000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(188,1,2,3,NULL,'entretien_materiel','Huile Razel',4000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(189,1,2,NULL,NULL,'autre','Marabout sud',25000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(190,1,2,NULL,NULL,'transport','Transport Makha',5000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(191,1,2,NULL,NULL,'autre','Marabout sud',22000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(192,1,2,NULL,NULL,'traitement_phytosanitaire','Traitement',21000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(193,1,2,NULL,NULL,'entretien_materiel','Dépenage moto',186000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(194,1,2,NULL,NULL,'materiel','Paire d\'arrosoirs',12000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(195,1,2,NULL,NULL,'entretien_materiel','Entretien tricycle',28000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(196,1,2,NULL,NULL,'carburant','Essence',15000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(197,1,2,NULL,NULL,'transport','Transport compost',10000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(198,1,2,3,NULL,'alimentation_betail','1 sac rakal Razel',10500.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(199,1,2,NULL,NULL,'carburant','Essence',10000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(200,1,2,NULL,NULL,'transport','Transport Tywo',15000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(201,1,2,NULL,NULL,'carburant','Essence',5000.00,'2026-03-15',0,NULL,NULL,NULL,NULL,NULL),(202,1,2,1,NULL,'frais_recolte','Frais De Récolte Tomate particulier',79000.00,'2026-04-08',0,NULL,NULL,NULL,NULL,NULL),(203,1,2,NULL,NULL,'financement_individuel','Financement - Abdou Aziz Fall : Campagne oignon 2025-2026',202000.00,'2026-04-08',1,'financement',1,NULL,NULL,NULL),(204,1,2,NULL,NULL,'financement_individuel','Financement - Mandickou Fall : Campagne oignon 2025-2026',269000.00,'2026-04-08',1,'financement',2,NULL,NULL,NULL),(205,1,2,NULL,NULL,'financement_individuel','Financement - Ousmane Fall Sa Thies : Campagne oignon 2025-2026',317000.00,'2026-04-08',1,'financement',3,NULL,NULL,NULL),(206,1,2,NULL,NULL,'financement_individuel','Financement - Amadou Diao Fall : Campagne oignon 2025-2026',289000.00,'2026-04-08',1,'financement',4,NULL,NULL,NULL),(207,1,2,NULL,NULL,'financement_individuel','Financement - Ablaye Fall Machine : Campagne oignon 2025-2026',61000.00,'2026-04-08',1,'financement',5,NULL,NULL,NULL),(208,1,2,NULL,NULL,'financement_individuel','Financement - Ablaye Fall : Campagne oignon 2025-2026',310000.00,'2026-04-08',1,'financement',6,NULL,NULL,NULL);
/*!40000 ALTER TABLE `depenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnostics`
--

DROP TABLE IF EXISTS `diagnostics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diagnostics` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `culture_id` bigint(20) unsigned DEFAULT NULL,
  `type_culture` enum('oignon','tomate','riz','courgette','piment','patate') NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `description_symptomes` text DEFAULT NULL,
  `maladie_detectee` varchar(200) DEFAULT NULL,
  `niveau_confiance` enum('faible','moyen','élevé') DEFAULT NULL,
  `symptomes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`symptomes`)),
  `traitement_immediat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`traitement_immediat`)),
  `produits_senegal` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`produits_senegal`)),
  `prevention` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`prevention`)),
  `conseil` text DEFAULT NULL,
  `reponse_ia_brute` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `diagnostics_user_id_foreign` (`user_id`),
  KEY `diagnostics_culture_id_foreign` (`culture_id`),
  KEY `diagnostics_organisation_id_index` (`organisation_id`),
  CONSTRAINT `diagnostics_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `diagnostics_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diagnostics_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnostics`
--

LOCK TABLES `diagnostics` WRITE;
/*!40000 ALTER TABLE `diagnostics` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnostics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employes`
--

DROP TABLE IF EXISTS `employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `poste` varchar(100) DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `salaire_mensuel_fcfa` decimal(12,2) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employes_user_id_foreign` (`user_id`),
  KEY `employes_organisation_id_index` (`organisation_id`),
  CONSTRAINT `employes_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employes`
--

LOCK TABLES `employes` WRITE;
/*!40000 ALTER TABLE `employes` DISABLE KEYS */;
INSERT INTO `employes` VALUES (1,1,2,'Abdou Aziz Fall','775759378','Gérant',NULL,0.00,1,NULL,NULL,NULL,NULL),(2,1,2,'Mandickou Fall',NULL,'Ouvrier',NULL,0.00,1,NULL,NULL,NULL,NULL),(3,1,2,'Ousmane Fall Sa Thies',NULL,'Ouvrier',NULL,0.00,1,NULL,NULL,NULL,NULL),(4,1,2,'Amadou Diao Fall',NULL,'Ouvrier',NULL,0.00,1,NULL,NULL,NULL,NULL),(5,1,2,'Ablaye Fall Machine',NULL,NULL,NULL,0.00,1,NULL,NULL,NULL,NULL),(6,1,2,'Ablaye Fall',NULL,'Ouvrier',NULL,0.00,1,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financements_individuels`
--

DROP TABLE IF EXISTS `financements_individuels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `financements_individuels` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `employe_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `montant_fcfa` decimal(12,2) NOT NULL,
  `motif` varchar(255) NOT NULL,
  `date_financement` date NOT NULL,
  `mode_paiement` varchar(255) NOT NULL DEFAULT 'especes',
  `statut` varchar(255) NOT NULL DEFAULT 'en_attente',
  `montant_rembourse_fcfa` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `depense_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `financements_individuels_organisation_id_foreign` (`organisation_id`),
  KEY `financements_individuels_employe_id_foreign` (`employe_id`),
  KEY `financements_individuels_user_id_foreign` (`user_id`),
  KEY `financements_individuels_depense_id_foreign` (`depense_id`),
  CONSTRAINT `financements_individuels_depense_id_foreign` FOREIGN KEY (`depense_id`) REFERENCES `depenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `financements_individuels_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `financements_individuels_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `financements_individuels_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financements_individuels`
--

LOCK TABLES `financements_individuels` WRITE;
/*!40000 ALTER TABLE `financements_individuels` DISABLE KEYS */;
INSERT INTO `financements_individuels` VALUES (1,1,1,2,202000.00,'Campagne oignon 2025-2026','2026-04-08','especes','en_cours',0.00,NULL,203,NULL,NULL,NULL),(2,1,2,2,269000.00,'Campagne oignon 2025-2026','2026-04-08','especes','en_cours',0.00,NULL,204,NULL,NULL,NULL),(3,1,3,2,317000.00,'Campagne oignon 2025-2026','2026-04-08','especes','en_cours',0.00,NULL,205,NULL,NULL,NULL),(4,1,4,2,289000.00,'Campagne oignon 2025-2026','2026-04-08','especes','en_cours',0.00,NULL,206,NULL,NULL,NULL),(5,1,5,2,61000.00,'Campagne oignon 2025-2026','2026-04-08','especes','en_cours',0.00,NULL,207,NULL,NULL,NULL),(6,1,6,2,310000.00,'Campagne oignon 2025-2026','2026-04-08','especes','rembourse',310000.00,NULL,208,NULL,NULL,NULL);
/*!40000 ALTER TABLE `financements_individuels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imports`
--

DROP TABLE IF EXISTS `imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `imports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `job_id` varchar(255) DEFAULT NULL,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `fichier_url` varchar(500) NOT NULL,
  `fichier_nom` varchar(255) NOT NULL,
  `statut` enum('en_attente','en_cours','termine','erreur') NOT NULL DEFAULT 'en_attente',
  `lignes_total` int(10) unsigned NOT NULL DEFAULT 0,
  `lignes_importees` int(10) unsigned NOT NULL DEFAULT 0,
  `lignes_erreur` int(10) unsigned NOT NULL DEFAULT 0,
  `erreurs_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`erreurs_detail`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `imports_user_id_foreign` (`user_id`),
  KEY `imports_organisation_id_index` (`organisation_id`),
  CONSTRAINT `imports_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `imports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imports`
--

LOCK TABLES `imports` WRITE;
/*!40000 ALTER TABLE `imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intrants`
--

DROP TABLE IF EXISTS `intrants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intrants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `nom` varchar(200) NOT NULL,
  `categorie` varchar(100) NOT NULL,
  `unite` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `intrants_organisation_id_index` (`organisation_id`),
  CONSTRAINT `intrants_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intrants`
--

LOCK TABLES `intrants` WRITE;
/*!40000 ALTER TABLE `intrants` DISABLE KEYS */;
INSERT INTO `intrants` VALUES (1,1,'NPK 15-15-15','Engrais','kg',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(2,1,'Urée 46%','Engrais','kg',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(3,1,'Semence de riz','Semence','kg',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(4,1,'Semence d\'oignon','Semence','kg',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(5,1,'Herbicide','Produit phytosanitaire','L',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(6,1,'Insecticide','Produit phytosanitaire','L',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46'),(7,1,'Fumure organique','Amendement','kg',NULL,1,'2026-04-19 18:05:46','2026-04-19 18:05:46');
/*!40000 ALTER TABLE `intrants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medias`
--

DROP TABLE IF EXISTS `medias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `champ_id` bigint(20) unsigned DEFAULT NULL,
  `culture_id` bigint(20) unsigned DEFAULT NULL,
  `type` enum('photo','video') NOT NULL,
  `fichier_url` varchar(500) NOT NULL,
  `fichier_path` varchar(500) DEFAULT NULL,
  `fichier_nom` varchar(255) NOT NULL,
  `taille_octets` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `date_prise` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medias_culture_id_index` (`culture_id`),
  KEY `medias_champ_id_foreign` (`champ_id`),
  CONSTRAINT `medias_champ_id_foreign` FOREIGN KEY (`champ_id`) REFERENCES `champs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `medias_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medias`
--

LOCK TABLES `medias` WRITE;
/*!40000 ALTER TABLE `medias` DISABLE KEYS */;
/*!40000 ALTER TABLE `medias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000001_create_cache_table',1),(2,'0001_01_01_000002_create_jobs_table',1),(3,'2026_01_01_000001_create_organisations_table',1),(4,'2026_01_01_000002_create_users_table',1),(5,'2026_01_01_000003_create_campagnes_agricoles_table',1),(6,'2026_01_01_000004_create_champs_table',1),(7,'2026_01_01_000005_create_intrants_table',1),(8,'2026_01_01_000006_create_cultures_table',1),(9,'2026_01_01_000007_create_medias_table',1),(10,'2026_01_01_000008_create_stocks_table',1),(11,'2026_01_01_000009_create_depenses_table',1),(12,'2026_01_01_000010_create_mouvements_stock_table',1),(13,'2026_01_01_000011_create_utilisations_intrants_table',1),(14,'2026_01_01_000012_create_ventes_table',1),(15,'2026_01_01_000013_create_employes_table',1),(16,'2026_01_01_000014_create_taches_table',1),(17,'2026_01_01_000015_create_paiements_salaire_table',1),(18,'2026_01_01_000016_create_notifications_table',1),(19,'2026_01_01_000017_create_abonnements_historique_table',1),(20,'2026_01_01_000018_create_audit_logs_table',1),(21,'2026_01_01_000019_create_imports_table',1),(22,'2026_01_01_000020_create_sync_queue_table',1),(23,'2026_04_05_180100_create_personal_access_tokens_table',1),(24,'2026_04_06_000001_add_champ_id_to_medias_table',1),(25,'2026_04_06_000002_create_diagnostics_table',1),(26,'2026_04_09_000001_create_financements_individuels_table',1),(27,'2026_04_09_000002_add_auto_generee_to_ventes_table',1),(28,'2026_04_11_113711_add_job_id_to_imports_table',1),(29,'2026_04_18_195233_phone_auth_users_table',1),(30,'2026_04_19_001916_add_unite_to_ventes_table',1),(31,'2026_04_21_000001_add_fichier_path_to_medias_table',2),(32,'2026_04_21_000001_make_user_id_nullable_on_org_tables',2),(33,'2026_04_23_000001_create_categories_depenses_table',2),(34,'2026_04_24_143823_create_whatsapp_users_table',2),(35,'2026_04_24_200000_fix_abonnements_historique_nullable_fin_confirme',3),(36,'2026_04_25_000001_add_type_culture_to_cultures_table',4),(37,'2026_04_25_000002_add_fields_to_whatsapp_users_table',4),(38,'2026_04_25_000003_add_alertes_and_location_fields',4),(39,'2026_04_25_000004_create_traitements_appliques_table',4),(40,'2026_04_25_000005_create_alertes_culturales_table',4),(41,'2026_04_26_000001_add_cucurbitacees_to_type_culture_enum',5);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mouvements_stock`
--

DROP TABLE IF EXISTS `mouvements_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mouvements_stock` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_id` bigint(20) unsigned NOT NULL,
  `type` enum('achat','utilisation','perte','ajustement') NOT NULL,
  `quantite` decimal(12,2) NOT NULL,
  `prix_unitaire_fcfa` decimal(12,2) DEFAULT NULL,
  `montant_total_fcfa` decimal(12,2) DEFAULT NULL,
  `fournisseur` varchar(200) DEFAULT NULL,
  `depense_id` bigint(20) unsigned DEFAULT NULL,
  `culture_id` bigint(20) unsigned DEFAULT NULL,
  `motif` varchar(300) DEFAULT NULL,
  `date_mouvement` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mouvements_stock_stock_id_index` (`stock_id`),
  KEY `mouvements_stock_depense_id_index` (`depense_id`),
  KEY `mouvements_stock_culture_id_index` (`culture_id`),
  KEY `mouvements_stock_stock_id_type_index` (`stock_id`,`type`),
  CONSTRAINT `mouvements_stock_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mouvements_stock_depense_id_foreign` FOREIGN KEY (`depense_id`) REFERENCES `depenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mouvements_stock_stock_id_foreign` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mouvements_stock`
--

LOCK TABLES `mouvements_stock` WRITE;
/*!40000 ALTER TABLE `mouvements_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `mouvements_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` varchar(50) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `canal` enum('app','email','sms','whatsapp','push') NOT NULL,
  `action_url` varchar(300) DEFAULT NULL,
  `est_lue` tinyint(1) NOT NULL DEFAULT 0,
  `lue_at` timestamp NULL DEFAULT NULL,
  `envoyee_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_organisation_id_index` (`organisation_id`),
  KEY `notifications_user_id_index` (`user_id`),
  KEY `notifications_user_id_est_lue_index` (`user_id`,`est_lue`),
  CONSTRAINT `notifications_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organisations`
--

DROP TABLE IF EXISTS `organisations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organisations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(200) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `email_contact` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `devise` varchar(5) NOT NULL DEFAULT 'FCFA',
  `plan` enum('gratuit','pro','entreprise') NOT NULL DEFAULT 'gratuit',
  `plan_expire_at` timestamp NULL DEFAULT NULL,
  `periode_essai_fin` timestamp NULL DEFAULT NULL,
  `est_active` tinyint(1) NOT NULL DEFAULT 1,
  `est_suspendue` tinyint(1) NOT NULL DEFAULT 0,
  `campagne_debut_mois` tinyint(4) NOT NULL DEFAULT 10,
  `campagne_debut_jour` tinyint(4) NOT NULL DEFAULT 1,
  `parametres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parametres`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organisations_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisations`
--

LOCK TABLES `organisations` WRITE;
/*!40000 ALTER TABLE `organisations` DISABLE KEYS */;
INSERT INTO `organisations` VALUES (1,'Exploitation Kadiar','kadiar-demo','admin@kadiar-demo.com','+221 77 000 0000',NULL,'FCFA','pro','2027-04-19 01:30:08','2026-05-19 01:30:08',1,0,10,1,NULL,'2026-04-19 01:30:08','2026-04-19 01:30:08',NULL);
/*!40000 ALTER TABLE `organisations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paiements_salaire`
--

DROP TABLE IF EXISTS `paiements_salaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paiements_salaire` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `employe_id` bigint(20) unsigned NOT NULL,
  `montant_fcfa` decimal(12,2) NOT NULL,
  `mois` varchar(7) NOT NULL,
  `date_paiement` date NOT NULL,
  `mode_paiement` enum('especes','mobile_money','virement','autre') NOT NULL DEFAULT 'especes',
  `notes` text DEFAULT NULL,
  `depense_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `paiements_salaire_depense_id_foreign` (`depense_id`),
  KEY `paiements_salaire_organisation_id_index` (`organisation_id`),
  KEY `paiements_salaire_employe_id_index` (`employe_id`),
  KEY `paiements_salaire_organisation_id_mois_index` (`organisation_id`,`mois`),
  CONSTRAINT `paiements_salaire_depense_id_foreign` FOREIGN KEY (`depense_id`) REFERENCES `depenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `paiements_salaire_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `paiements_salaire_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paiements_salaire`
--

LOCK TABLES `paiements_salaire` WRITE;
/*!40000 ALTER TABLE `paiements_salaire` DISABLE KEYS */;
/*!40000 ALTER TABLE `paiements_salaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remboursements_financement`
--

DROP TABLE IF EXISTS `remboursements_financement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `remboursements_financement` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `financement_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `montant_fcfa` decimal(12,2) NOT NULL,
  `date_remboursement` date NOT NULL,
  `mode_paiement` varchar(255) NOT NULL DEFAULT 'especes',
  `vente_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `remboursements_financement_organisation_id_foreign` (`organisation_id`),
  KEY `remboursements_financement_financement_id_foreign` (`financement_id`),
  KEY `remboursements_financement_user_id_foreign` (`user_id`),
  KEY `remboursements_financement_vente_id_foreign` (`vente_id`),
  CONSTRAINT `remboursements_financement_financement_id_foreign` FOREIGN KEY (`financement_id`) REFERENCES `financements_individuels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `remboursements_financement_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `remboursements_financement_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `remboursements_financement_vente_id_foreign` FOREIGN KEY (`vente_id`) REFERENCES `ventes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remboursements_financement`
--

LOCK TABLES `remboursements_financement` WRITE;
/*!40000 ALTER TABLE `remboursements_financement` DISABLE KEYS */;
INSERT INTO `remboursements_financement` VALUES (1,1,6,2,310000.00,'2026-04-08','especes',1,'2026-04-19 18:05:46',NULL);
/*!40000 ALTER TABLE `remboursements_financement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stocks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `intrant_id` bigint(20) unsigned DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `categorie` varchar(100) NOT NULL,
  `quantite_actuelle` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unite` varchar(20) NOT NULL,
  `seuil_alerte` decimal(12,2) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stocks_user_id_foreign` (`user_id`),
  KEY `stocks_intrant_id_foreign` (`intrant_id`),
  KEY `stocks_organisation_id_index` (`organisation_id`),
  KEY `stocks_organisation_id_est_actif_index` (`organisation_id`,`est_actif`),
  CONSTRAINT `stocks_intrant_id_foreign` FOREIGN KEY (`intrant_id`) REFERENCES `intrants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stocks_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stocks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_queue`
--

DROP TABLE IF EXISTS `sync_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sync_queue` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(100) NOT NULL,
  `action` varchar(20) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `sync_id` char(36) NOT NULL,
  `statut` enum('en_attente','traite','conflit','erreur') NOT NULL DEFAULT 'en_attente',
  `traite_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sync_queue_sync_id_unique` (`sync_id`),
  KEY `sync_queue_user_id_foreign` (`user_id`),
  KEY `sync_queue_organisation_id_index` (`organisation_id`),
  KEY `sync_queue_organisation_id_statut_index` (`organisation_id`,`statut`),
  CONSTRAINT `sync_queue_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sync_queue_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_queue`
--

LOCK TABLES `sync_queue` WRITE;
/*!40000 ALTER TABLE `sync_queue` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_queue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taches`
--

DROP TABLE IF EXISTS `taches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `employe_id` bigint(20) unsigned NOT NULL,
  `champ_id` bigint(20) unsigned DEFAULT NULL,
  `culture_id` bigint(20) unsigned DEFAULT NULL,
  `titre` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` enum('a_faire','en_cours','termine','annule') NOT NULL DEFAULT 'a_faire',
  `priorite` enum('basse','normale','haute','urgente') NOT NULL DEFAULT 'normale',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `taches_champ_id_foreign` (`champ_id`),
  KEY `taches_culture_id_foreign` (`culture_id`),
  KEY `taches_organisation_id_index` (`organisation_id`),
  KEY `taches_employe_id_index` (`employe_id`),
  KEY `taches_organisation_id_statut_index` (`organisation_id`,`statut`),
  CONSTRAINT `taches_champ_id_foreign` FOREIGN KEY (`champ_id`) REFERENCES `champs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `taches_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `taches_employe_id_foreign` FOREIGN KEY (`employe_id`) REFERENCES `employes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `taches_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taches`
--

LOCK TABLES `taches` WRITE;
/*!40000 ALTER TABLE `taches` DISABLE KEYS */;
/*!40000 ALTER TABLE `taches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `traitements_appliques`
--

DROP TABLE IF EXISTS `traitements_appliques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `traitements_appliques` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `culture_id` bigint(20) unsigned NOT NULL,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `produit` varchar(255) NOT NULL,
  `matiere_active` varchar(255) DEFAULT NULL,
  `dose` varchar(255) DEFAULT NULL,
  `date_application` date NOT NULL,
  `source` enum('whatsapp','manuel') NOT NULL DEFAULT 'whatsapp',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `traitements_appliques_culture_id_foreign` (`culture_id`),
  KEY `traitements_appliques_organisation_id_foreign` (`organisation_id`),
  KEY `traitements_appliques_user_id_foreign` (`user_id`),
  CONSTRAINT `traitements_appliques_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `traitements_appliques_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `traitements_appliques_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `traitements_appliques`
--

LOCK TABLES `traitements_appliques` WRITE;
/*!40000 ALTER TABLE `traitements_appliques` DISABLE KEYS */;
/*!40000 ALTER TABLE `traitements_appliques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','lecteur') NOT NULL DEFAULT 'lecteur',
  `alertes_whatsapp_actives` tinyint(1) NOT NULL DEFAULT 1,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `preferences_notification` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences_notification`)),
  `derniere_connexion_at` timestamp NULL DEFAULT NULL,
  `onboarding_complete` tinyint(1) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_telephone_unique` (`telephone`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_organisation_id_index` (`organisation_id`),
  KEY `users_email_index` (`email`),
  CONSTRAINT `users_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Super Admin Agri-ERP','superadmin@agri-erp.com','00000000','$2y$12$8dTxjiYRjksXaAEq9IE4fO3cL9snwqGEJ5nAfeZ3/ivpbrSEbPaHq','super_admin',1,1,NULL,NULL,1,NULL,'2026-04-19 01:30:08','2026-04-19 01:30:08',NULL),(2,1,'Mamadou Diallo','admin@kadiar-demo.com','77 000 0001','$2y$12$BI9wJCcmcCfTIpIB3jPQBuyLQLAM4zyGHykwAgJBurnoigtaf2dHu','admin',1,1,NULL,NULL,1,NULL,'2026-04-19 01:30:08','2026-04-19 01:30:08',NULL),(3,1,'Aïssatou Bah','lecteur@kadiar-demo.com','77 000 0002','$2y$12$KFWIM58qoMIo9WiY/nqTqekqT3eTfP2wCxlaDDshceqREMNlatSWe','lecteur',1,1,NULL,NULL,1,NULL,'2026-04-19 01:30:08','2026-04-19 01:30:08',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisations_intrants`
--

DROP TABLE IF EXISTS `utilisations_intrants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `utilisations_intrants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `culture_id` bigint(20) unsigned NOT NULL,
  `intrant_id` bigint(20) unsigned DEFAULT NULL,
  `stock_id` bigint(20) unsigned DEFAULT NULL,
  `nom_intrant` varchar(200) NOT NULL,
  `quantite` decimal(10,2) NOT NULL,
  `unite` varchar(20) NOT NULL,
  `cout_total_fcfa` decimal(12,2) DEFAULT NULL,
  `date_utilisation` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisations_intrants_intrant_id_foreign` (`intrant_id`),
  KEY `utilisations_intrants_organisation_id_index` (`organisation_id`),
  KEY `utilisations_intrants_culture_id_index` (`culture_id`),
  KEY `utilisations_intrants_stock_id_index` (`stock_id`),
  CONSTRAINT `utilisations_intrants_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `utilisations_intrants_intrant_id_foreign` FOREIGN KEY (`intrant_id`) REFERENCES `intrants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `utilisations_intrants_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `utilisations_intrants_stock_id_foreign` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisations_intrants`
--

LOCK TABLES `utilisations_intrants` WRITE;
/*!40000 ALTER TABLE `utilisations_intrants` DISABLE KEYS */;
/*!40000 ALTER TABLE `utilisations_intrants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventes`
--

DROP TABLE IF EXISTS `ventes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ventes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `champ_id` bigint(20) unsigned DEFAULT NULL,
  `culture_id` bigint(20) unsigned DEFAULT NULL,
  `campagne_id` bigint(20) unsigned DEFAULT NULL,
  `acheteur` varchar(200) DEFAULT NULL,
  `produit` varchar(200) NOT NULL,
  `quantite_kg` decimal(12,2) NOT NULL,
  `unite` varchar(10) NOT NULL DEFAULT 'kg',
  `prix_unitaire_fcfa` decimal(12,2) NOT NULL,
  `montant_total_fcfa` decimal(14,2) NOT NULL,
  `date_vente` date NOT NULL,
  `notes` text DEFAULT NULL,
  `est_auto_generee` tinyint(1) NOT NULL DEFAULT 0,
  `source_type` varchar(255) DEFAULT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ventes_user_id_foreign` (`user_id`),
  KEY `ventes_culture_id_foreign` (`culture_id`),
  KEY `ventes_organisation_id_index` (`organisation_id`),
  KEY `ventes_champ_id_index` (`champ_id`),
  KEY `ventes_campagne_id_index` (`campagne_id`),
  KEY `ventes_organisation_id_date_vente_index` (`organisation_id`,`date_vente`),
  CONSTRAINT `ventes_campagne_id_foreign` FOREIGN KEY (`campagne_id`) REFERENCES `campagnes_agricoles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ventes_champ_id_foreign` FOREIGN KEY (`champ_id`) REFERENCES `champs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ventes_culture_id_foreign` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ventes_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ventes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventes`
--

LOCK TABLES `ventes` WRITE;
/*!40000 ALTER TABLE `ventes` DISABLE KEYS */;
INSERT INTO `ventes` VALUES (1,1,2,NULL,NULL,NULL,'Ablaye Fall','Remboursement financement - Ablaye Fall',1.00,'kg',310000.00,310000.00,'2026-04-08',NULL,1,'remboursement_financement',1,NULL,NULL,NULL),(2,1,2,1,NULL,NULL,NULL,'Tomate',2480.00,'kg',59.50,147560.00,'2026-04-08','1) 90 caisses',0,NULL,NULL,NULL,NULL,NULL),(3,1,2,1,NULL,NULL,NULL,'Tomate',2370.00,'kg',59.50,141015.00,'2026-04-08','2) 90 caisses',0,NULL,NULL,NULL,NULL,NULL),(4,1,2,1,NULL,NULL,NULL,'Tomate',2220.00,'kg',59.50,132090.00,'2026-04-08','3) 90 caisses',0,NULL,NULL,NULL,NULL,NULL),(5,1,2,1,NULL,NULL,NULL,'Tomate',2510.00,'kg',59.50,149345.00,'2026-04-08','4) 90 caisses',0,NULL,NULL,NULL,NULL,NULL),(6,1,2,2,NULL,NULL,NULL,'Tomate',2450.00,'kg',59.50,145775.00,'2026-04-08','1) 90 caisses',0,NULL,NULL,NULL,NULL,NULL),(7,1,2,2,NULL,NULL,NULL,'Tomate',1950.00,'kg',59.50,116025.00,'2026-04-08','2) 70 caisses',0,NULL,NULL,NULL,NULL,NULL),(8,1,2,2,NULL,NULL,NULL,'Tomate',2390.00,'kg',59.50,142205.00,'2026-04-08','3) 90 Caisses',0,NULL,NULL,NULL,NULL,NULL),(9,1,2,2,NULL,NULL,NULL,'Tomate',2440.00,'kg',59.50,145180.00,'2026-04-08','4) 90 Caisses',0,NULL,NULL,NULL,NULL,NULL),(10,1,2,3,NULL,NULL,NULL,'Tomate',2400.00,'kg',59.50,142800.00,'2026-04-08','1) 90 Caisses',0,NULL,NULL,NULL,NULL,NULL),(11,1,2,3,NULL,NULL,NULL,'Tomate',2430.00,'kg',59.50,144585.00,'2026-04-08','2) 90 Caisses',0,NULL,NULL,NULL,NULL,NULL),(12,1,2,3,NULL,NULL,NULL,'Tomate',760.00,'kg',59.50,45220.00,'2026-04-08','3) 30 Caisses',0,NULL,NULL,NULL,NULL,NULL),(13,1,2,3,NULL,NULL,NULL,'Tomate',2130.00,'kg',59.50,126735.00,'2026-04-08','4) 80 Caisses',0,NULL,NULL,NULL,NULL,NULL),(14,1,2,3,NULL,NULL,NULL,'Tomate',2080.00,'kg',59.50,123760.00,'2026-04-08','5) 80 Caisses',0,NULL,NULL,NULL,NULL,NULL),(15,1,2,1,NULL,NULL,NULL,'Tomate',3466.66,'kg',269.71,935000.00,'2026-04-08','Récolte Tomate Particulier petit cargo 270 grand cargo 180',0,NULL,NULL,NULL,NULL,NULL),(16,1,2,1,NULL,NULL,NULL,'Oignon',187.00,'kg',5000.00,935000.00,'2026-04-08','Récolte Oignon Champs Yokh ( Environ 190 Sacs)',0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `ventes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_users`
--

DROP TABLE IF EXISTS `whatsapp_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `organisation_id` bigint(20) unsigned NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT 1,
  `langue` enum('fr','wo') NOT NULL DEFAULT 'fr',
  `systeme_arrosage` enum('aspersion','goutte_a_goutte','gravitaire') DEFAULT NULL,
  `onboarded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `whatsapp_users_phone_number_unique` (`phone_number`),
  KEY `whatsapp_users_user_id_foreign` (`user_id`),
  KEY `whatsapp_users_organisation_id_foreign` (`organisation_id`),
  CONSTRAINT `whatsapp_users_organisation_id_foreign` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `whatsapp_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_users`
--

LOCK TABLES `whatsapp_users` WRITE;
/*!40000 ALTER TABLE `whatsapp_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-27  8:30:42
