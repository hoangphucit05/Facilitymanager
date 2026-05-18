-- Gán URL ảnh đại diện theo id (khớp 50 file trong frontend/public/dist: assets/images/avatar/avatar_N.jpg)
SET NAMES utf8mb4;

UPDATE `users`
SET `avatar_url` = CONCAT('/assets/images/avatar/avatar_', `id`, '.jpg')
WHERE `id` >= 1 AND `id` <= 50;
