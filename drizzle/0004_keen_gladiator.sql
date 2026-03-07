CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`company` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_email_unique` UNIQUE(`email`)
);
