-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema food_app
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema food_app
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `food_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `food_app` ;

-- -----------------------------------------------------
-- Table `food_app`.`diet_preference`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`diet_preference` (
  `diet_preference_id` INT NOT NULL AUTO_INCREMENT,
  `diet_name` VARCHAR(255) NOT NULL,
  `diet_type` VARCHAR(50) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`diet_preference_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 42
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`ingredient_tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`ingredient_tag` (
  `ingredient_tag_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `tag_type` VARCHAR(50) NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`ingredient_tag_id`),
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 42
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`diet_preference_rule`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`diet_preference_rule` (
  `diet_preference_rule_id` INT NOT NULL AUTO_INCREMENT,
  `diet_preference_id` INT NOT NULL,
  `ingredient_tag_id` INT NOT NULL,
  `conflict_type` VARCHAR(50) NOT NULL,
  `conflict_severity` VARCHAR(50) NULL DEFAULT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`diet_preference_rule_id`),
  UNIQUE INDEX `uq_preference_tag` (`diet_preference_id` ASC, `ingredient_tag_id` ASC) VISIBLE,
  INDEX `fk_dpr_tag` (`ingredient_tag_id` ASC) VISIBLE,
  CONSTRAINT `fk_dpr_preference`
    FOREIGN KEY (`diet_preference_id`)
    REFERENCES `food_app`.`diet_preference` (`diet_preference_id`),
  CONSTRAINT `fk_dpr_tag`
    FOREIGN KEY (`ingredient_tag_id`)
    REFERENCES `food_app`.`ingredient_tag` (`ingredient_tag_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 101
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- Local user for the unauthenticated, private prototype API. This sentinel is
-- deliberately not a usable password hash; authentication is not implemented.
INSERT INTO `food_app`.`user`
  (`user_id`, `first_name`, `last_name`, `email`, `password_hash`)
VALUES
  (1, 'Prototype', 'Tester', 'prototype@cookitup.invalid', '!disabled-prototype-account!')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);


-- -----------------------------------------------------
-- Table `food_app`.`ingredient`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`ingredient` (
  `ingredient_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `source_type` VARCHAR(100) NOT NULL,
  `external_id` VARCHAR(255) NULL DEFAULT NULL,
  `creator_user_id` INT NULL DEFAULT NULL,
  `visibility` VARCHAR(20) NOT NULL DEFAULT 'Private',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ingredient_id`),
  INDEX `fk_ingredient_creator` (`creator_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_ingredient_creator`
    FOREIGN KEY (`creator_user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 101
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`food_item`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`food_item` (
  `food_item_id` INT NOT NULL AUTO_INCREMENT,
  `ingredient_id` INT NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `food_item_type` VARCHAR(50) NOT NULL,
  `creator_user_id` INT NULL DEFAULT NULL,
  `visibility` VARCHAR(20) NOT NULL DEFAULT 'Private',
  `serving_description` VARCHAR(255) NOT NULL,
  `serving_quantity` DECIMAL(10,3) NOT NULL,
  `serving_unit` VARCHAR(50) NOT NULL,
  `standardized_quantity` DECIMAL(12,3) NOT NULL,
  `standardized_unit` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`food_item_id`),
  INDEX `fk_food_item_ingredient` (`ingredient_id` ASC) VISIBLE,
  INDEX `fk_food_item_creator` (`creator_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_food_item_creator`
    FOREIGN KEY (`creator_user_id`)
    REFERENCES `food_app`.`user` (`user_id`),
  CONSTRAINT `fk_food_item_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `food_app`.`ingredient` (`ingredient_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 101
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`recipe`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`recipe` (
  `recipe_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `creator_user_id` INT NULL DEFAULT NULL,
  `source_type` VARCHAR(50) NOT NULL,
  `servings` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`recipe_id`),
  INDEX `fk_recipe_creator` (`creator_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_recipe_creator`
    FOREIGN KEY (`creator_user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 42
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`inventory_batch`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`inventory_batch` (
  `inventory_batch_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `food_item_id` INT NOT NULL,
  `recipe_id` INT NULL DEFAULT NULL,
  `container_quantity` DECIMAL(12,3) NOT NULL,
  `original_servings` DECIMAL(12,3) NOT NULL,
  `remaining_servings` DECIMAL(12,3) NOT NULL,
  `batch_created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiration_date` DATE NULL DEFAULT NULL,
  `purchase_price` DECIMAL(10,2) NULL DEFAULT NULL,
  `source_type` VARCHAR(50) NOT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `storage_location` VARCHAR(30) NOT NULL DEFAULT 'other',
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`inventory_batch_id`),
  INDEX `fk_inventory_batch_user` (`user_id` ASC) VISIBLE,
  INDEX `fk_inventory_batch_food_item` (`food_item_id` ASC) VISIBLE,
  INDEX `fk_inventory_batch_recipe` (`recipe_id` ASC) VISIBLE,
  CONSTRAINT `fk_inventory_batch_food_item`
    FOREIGN KEY (`food_item_id`)
    REFERENCES `food_app`.`food_item` (`food_item_id`),
  CONSTRAINT `fk_inventory_batch_recipe`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `food_app`.`recipe` (`recipe_id`),
  CONSTRAINT `fk_inventory_batch_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 101
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`food_consumption`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`food_consumption` (
  `consumption_id` INT NOT NULL AUTO_INCREMENT,
  `inventory_batch_id` INT NOT NULL,
  `quantity_consumed` DECIMAL(12,3) NOT NULL,
  `consumed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`consumption_id`),
  INDEX `idx_consumption_batch_date` (`inventory_batch_id` ASC, `consumed_at` ASC) VISIBLE,
  CONSTRAINT `fk_consumption_inventory_batch`
    FOREIGN KEY (`inventory_batch_id`)
    REFERENCES `food_app`.`inventory_batch` (`inventory_batch_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 101
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`food_item_source`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`food_item_source` (
  `food_item_source_id` INT NOT NULL AUTO_INCREMENT,
  `food_item_id` INT NOT NULL,
  `source_type` VARCHAR(100) NOT NULL,
  `source_name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) NULL DEFAULT NULL,
  `source_url` VARCHAR(1000) NULL DEFAULT NULL,
  `information_type` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`food_item_source_id`),
  INDEX `fk_food_item_source_food_item` (`food_item_id` ASC) VISIBLE,
  CONSTRAINT `fk_food_item_source_food_item`
    FOREIGN KEY (`food_item_id`)
    REFERENCES `food_app`.`food_item` (`food_item_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 42
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`food_product`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`food_product` (
  `food_product_id` INT NOT NULL AUTO_INCREMENT,
  `food_item_id` INT NOT NULL,
  `brand` VARCHAR(255) NULL DEFAULT NULL,
  `manufacturer` VARCHAR(255) NULL DEFAULT NULL,
  `barcode` VARCHAR(100) NULL DEFAULT NULL,
  `package_quantity` DECIMAL(12,3) NULL DEFAULT NULL,
  `package_unit` VARCHAR(50) NULL DEFAULT NULL,
  `label_serving_quantity` DECIMAL(10,3) NULL DEFAULT NULL,
  `label_serving_unit` VARCHAR(50) NULL DEFAULT NULL,
  `servings_per_package` DECIMAL(10,3) NULL DEFAULT NULL,
  `product_identifier` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`food_product_id`),
  UNIQUE INDEX `food_item_id` (`food_item_id` ASC) VISIBLE,
  UNIQUE INDEX `barcode` (`barcode` ASC) VISIBLE,
  CONSTRAINT `fk_food_product_food_item`
    FOREIGN KEY (`food_item_id`)
    REFERENCES `food_app`.`food_item` (`food_item_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 42
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`food_product_ingredient`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`food_product_ingredient` (
  `food_product_ingredient_id` INT NOT NULL AUTO_INCREMENT,
  `food_product_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  `ingredient_order` INT NULL DEFAULT NULL,
  PRIMARY KEY (`food_product_ingredient_id`),
  UNIQUE INDEX `uq_food_product_ingredient` (`food_product_id` ASC, `ingredient_id` ASC) VISIBLE,
  INDEX `fk_fpi_ingredient` (`ingredient_id` ASC) VISIBLE,
  CONSTRAINT `fk_fpi_food_product`
    FOREIGN KEY (`food_product_id`)
    REFERENCES `food_app`.`food_product` (`food_product_id`),
  CONSTRAINT `fk_fpi_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `food_app`.`ingredient` (`ingredient_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 51
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`ingredient_tag_assignment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`ingredient_tag_assignment` (
  `ingredient_tag_assignment_id` INT NOT NULL AUTO_INCREMENT,
  `ingredient_id` INT NOT NULL,
  `ingredient_tag_id` INT NOT NULL,
  PRIMARY KEY (`ingredient_tag_assignment_id`),
  UNIQUE INDEX `uq_ingredient_tag` (`ingredient_id` ASC, `ingredient_tag_id` ASC) VISIBLE,
  INDEX `fk_ita_tag` (`ingredient_tag_id` ASC) VISIBLE,
  CONSTRAINT `fk_ita_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `food_app`.`ingredient` (`ingredient_id`),
  CONSTRAINT `fk_ita_tag`
    FOREIGN KEY (`ingredient_tag_id`)
    REFERENCES `food_app`.`ingredient_tag` (`ingredient_tag_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 500
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`meal_plan`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`meal_plan` (
  `meal_plan_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `recipe_id` INT NOT NULL,
  `planned_date` DATE NOT NULL,
  `planned_time` TIME NULL DEFAULT NULL,
  `meal_type` VARCHAR(50) NULL DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Planned',
  `notes` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`meal_plan_id`),
  INDEX `fk_meal_plan_user` (`user_id` ASC) VISIBLE,
  INDEX `fk_meal_plan_recipe` (`recipe_id` ASC) VISIBLE,
  CONSTRAINT `fk_meal_plan_recipe`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `food_app`.`recipe` (`recipe_id`),
  CONSTRAINT `fk_meal_plan_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`nutrient`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`nutrient` (
  `nutrient_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(30) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`nutrient_id`),
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- Calories are stored as a regular nutrient so the existing nutrition model
-- remains usable by later recipe and nutrition features.
INSERT INTO `food_app`.`nutrient` (`name`, `unit`, `description`)
VALUES ('Calories', 'kcal', 'Energy per serving')
ON DUPLICATE KEY UPDATE `unit` = VALUES(`unit`);


-- -----------------------------------------------------
-- Table `food_app`.`nutrition_value`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`nutrition_value` (
  `nutrition_value_id` INT NOT NULL AUTO_INCREMENT,
  `food_item_id` INT NOT NULL,
  `nutrient_id` INT NOT NULL,
  `amount` DECIMAL(14,4) NOT NULL,
  PRIMARY KEY (`nutrition_value_id`),
  UNIQUE INDEX `uq_food_item_nutrient` (`food_item_id` ASC, `nutrient_id` ASC) VISIBLE,
  INDEX `fk_nutrition_value_nutrient` (`nutrient_id` ASC) VISIBLE,
  CONSTRAINT `fk_nutrition_value_food_item`
    FOREIGN KEY (`food_item_id`)
    REFERENCES `food_app`.`food_item` (`food_item_id`),
  CONSTRAINT `fk_nutrition_value_nutrient`
    FOREIGN KEY (`nutrient_id`)
    REFERENCES `food_app`.`nutrient` (`nutrient_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 3012
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`recipe_ingredient`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`recipe_ingredient` (
  `recipe_ingredient_id` INT NOT NULL AUTO_INCREMENT,
  `recipe_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  `quantity` DECIMAL(12,3) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `preparation_notes` TEXT NULL DEFAULT NULL,
  `is_optional` TINYINT(1) NOT NULL DEFAULT '0',
  `ingredient_order` INT NULL DEFAULT NULL,
  PRIMARY KEY (`recipe_ingredient_id`),
  UNIQUE INDEX `uq_recipe_ingredient` (`recipe_id` ASC, `ingredient_id` ASC) VISIBLE,
  INDEX `fk_recipe_ingredient_ingredient` (`ingredient_id` ASC) VISIBLE,
  CONSTRAINT `fk_recipe_ingredient_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `food_app`.`ingredient` (`ingredient_id`),
  CONSTRAINT `fk_recipe_ingredient_recipe`
    FOREIGN KEY (`recipe_id`)
    REFERENCES `food_app`.`recipe` (`recipe_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`recipe_ingredient_substitution`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`recipe_ingredient_substitution` (
  `substitution_id` INT NOT NULL AUTO_INCREMENT,
  `recipe_ingredient_id` INT NOT NULL,
  `substitute_ingredient_id` INT NOT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`substitution_id`),
  INDEX `fk_substitution_recipe_ingredient` (`recipe_ingredient_id` ASC) VISIBLE,
  INDEX `fk_substitution_ingredient` (`substitute_ingredient_id` ASC) VISIBLE,
  CONSTRAINT `fk_substitution_ingredient`
    FOREIGN KEY (`substitute_ingredient_id`)
    REFERENCES `food_app`.`ingredient` (`ingredient_id`),
  CONSTRAINT `fk_substitution_recipe_ingredient`
    FOREIGN KEY (`recipe_ingredient_id`)
    REFERENCES `food_app`.`recipe_ingredient` (`recipe_ingredient_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`shopping_list`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`shopping_list` (
  `shopping_list_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scheduled_date` DATE NULL DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`shopping_list_id`),
  INDEX `fk_shopping_list_user` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_shopping_list_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`shopping_list_item`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`shopping_list_item` (
  `shopping_list_item_id` INT NOT NULL AUTO_INCREMENT,
  `shopping_list_id` INT NOT NULL,
  `food_item_id` INT NOT NULL,
  `quantity` DECIMAL(12,3) NOT NULL,
  `purchased` TINYINT(1) NOT NULL DEFAULT '0',
  `notes` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`shopping_list_item_id`),
  INDEX `fk_shopping_list_item_list` (`shopping_list_id` ASC) VISIBLE,
  INDEX `fk_shopping_list_item_food_item` (`food_item_id` ASC) VISIBLE,
  CONSTRAINT `fk_shopping_list_item_food_item`
    FOREIGN KEY (`food_item_id`)
    REFERENCES `food_app`.`food_item` (`food_item_id`),
  CONSTRAINT `fk_shopping_list_item_list`
    FOREIGN KEY (`shopping_list_id`)
    REFERENCES `food_app`.`shopping_list` (`shopping_list_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`user_diet_preference`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`user_diet_preference` (
  `user_diet_preference_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `diet_preference_id` INT NOT NULL,
  `severity` VARCHAR(50) NULL DEFAULT NULL,
  `conflict_action` VARCHAR(50) NOT NULL DEFAULT 'Highlight',
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`user_diet_preference_id`),
  UNIQUE INDEX `uq_user_diet_preference` (`user_id` ASC, `diet_preference_id` ASC) VISIBLE,
  INDEX `fk_udp_preference` (`diet_preference_id` ASC) VISIBLE,
  CONSTRAINT `fk_udp_preference`
    FOREIGN KEY (`diet_preference_id`)
    REFERENCES `food_app`.`diet_preference` (`diet_preference_id`),
  CONSTRAINT `fk_udp_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `food_app`.`user_nutritional_goal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `food_app`.`user_nutritional_goal` (
  `user_nutritional_goal_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `nutrient_id` INT NOT NULL,
  `target_value` DECIMAL(14,4) NOT NULL,
  `direction` VARCHAR(20) NOT NULL,
  `period` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`user_nutritional_goal_id`),
  INDEX `fk_ung_user` (`user_id` ASC) VISIBLE,
  INDEX `fk_ung_nutrient` (`nutrient_id` ASC) VISIBLE,
  CONSTRAINT `fk_ung_nutrient`
    FOREIGN KEY (`nutrient_id`)
    REFERENCES `food_app`.`nutrient` (`nutrient_id`),
  CONSTRAINT `fk_ung_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `food_app`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
