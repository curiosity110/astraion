from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("people", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="phone",
            name="e164",
            field=models.CharField(max_length=32),
        ),
    ]
