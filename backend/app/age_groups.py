from datetime import date


def calculate_age(date_of_birth: date, today: date | None = None) -> int:
    current_date = today or date.today()
    age = current_date.year - date_of_birth.year
    if (current_date.month, current_date.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


def age_group_for_age(age: int) -> str | None:
    # Boundary ages (4 and 6) belong to the band that starts at that age,
    # so the "4-6" group actually starts at age 4 and "6-8" at age 6.
    if 2 <= age < 4:
        return "2-4"
    if 4 <= age < 6:
        return "4-6"
    if 6 <= age <= 8:
        return "6-8"
    return None


def age_group_for_date_of_birth(date_of_birth: date | None) -> str | None:
    if date_of_birth is None:
        return None
    return age_group_for_age(calculate_age(date_of_birth))
