# Import seed phòng UTF-8 (tránh hỏng tiếng Việt khi pipe qua PowerShell)
$ErrorActionPreference = "Stop"
$seed = Join-Path $PSScriptRoot "seed_rooms_giao_vien.sql"
$container = if ($env:MYSQL_CONTAINER) { $env:MYSQL_CONTAINER } else { "facility-mysql" }

if (-not (Test-Path $seed)) { throw "Không tìm thấy: $seed" }

docker cp $seed "${container}:/tmp/seed_rooms.sql"
docker exec $container sh -c "mysql --default-character-set=utf8mb4 -uroot -p1234567891 asset_management < /tmp/seed_rooms.sql"
Write-Host "Đã import seed phòng (utf8mb4). Kiểm tra P3E5:"
docker exec $container mysql --default-character-set=utf8mb4 -uroot -p1234567891 -N -e "SELECT room_code, teacher_name, class_using FROM asset_management.rooms WHERE room_code='P3E5';"
