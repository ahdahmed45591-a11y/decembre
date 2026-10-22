from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("api", "0006_idempotency_key")]
    operations = [migrations.RemoveField(model_name="user", name="portfolio_value")]
