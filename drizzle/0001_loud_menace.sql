CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`location` varchar(255),
	`startDate` varchar(50),
	`endDate` varchar(50),
	`description` text,
	`color` varchar(20) DEFAULT '#2C3E7A',
	`logoUrl` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `exhibitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`stand` varchar(50),
	`website` varchar(500),
	`description` text,
	`shortDescription` varchar(300),
	`sector` varchar(255),
	`themes` json DEFAULT ('[]'),
	`tier` enum('A','B','C','D') NOT NULL DEFAULT 'C',
	`sodexoScore` int DEFAULT 0,
	`sodexoReason` text,
	`thematicTags` json DEFAULT ('[]'),
	`logoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exhibitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exhibitorId` int NOT NULL,
	`eventId` int NOT NULL,
	`voteType` enum('like','superlike','dislike') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
