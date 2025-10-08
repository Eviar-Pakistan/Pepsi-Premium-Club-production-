import sqlite3
import MySQLdb

# SQLite connection
sqlite_conn = sqlite3.connect("db.sqlite3")
sqlite_cursor = sqlite_conn.cursor()

# MySQL connection
mysql_conn = MySQLdb.connect(
    host="pepsi-database.cvscucciy7kr.eu-north-1.rds.amazonaws.com",
    user="admin",
    passwd="Avenger123?",
    db="pepsidatabase"
)
mysql_cursor = mysql_conn.cursor()

# sqlite_cursor.execute("SELECT * FROM django_content_type;")
# rows = sqlite_cursor.fetchall()

# for row in rows:
#     mysql_cursor.execute(
#         "INSERT INTO django_content_type (id,app_label,model) "
#         "VALUES (%s,%s,%s)",
#         row
#     )

mysql_conn.commit()
