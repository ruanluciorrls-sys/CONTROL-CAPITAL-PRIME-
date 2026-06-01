CREATE TABLE `casas` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`nome` text NOT NULL,
	`login` text,
	`senha` text,
	`media` text,
	`linkCasa` text,
	`linkContaFina` text,
	`meta` decimal(10,2),
	`status` enum('ativa','finalizada') NOT NULL DEFAULT 'ativa',
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `casas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relatorios` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`casaId` varchar(64) NOT NULL,
	`agente` text NOT NULL,
	`status` enum('ativo','finalizado') NOT NULL DEFAULT 'ativo',
	`rows` json NOT NULL DEFAULT ('[]'),
	`cooperacao` decimal(10,2) NOT NULL DEFAULT '0',
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relatorios_id` PRIMARY KEY(`id`)
);
