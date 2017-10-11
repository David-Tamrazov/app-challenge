
<-- Execute this first -->
CREATE TABLE `payroll_schema`.`timefiles` (
  `employee_id` INT NOT NULL,
  `report_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `hours_worked` FLOAT NOT NULL,
  `job_group` VARCHAR(1) NOT NULL,
  PRIMARY KEY (`employee_id`, `date`),
  INDEX `report` (`report_id` ASC));


<-- Execute this second -->
CREATE TABLE `payroll_schema`.`payroll_report` (
  `employee_id` INT NOT NULL,
  `pay_period` VARCHAR(45) NOT NULL,
  `amount_paid` FLOAT NOT NULL,
  PRIMARY KEY (`employee_id`, `pay_period`),
  CONSTRAINT `eid`
    FOREIGN KEY (`employee_id`)
    REFERENCES `payroll_schema`.`timefiles` (`employee_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);
