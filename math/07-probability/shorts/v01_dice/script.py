"""
The spoken text of the short "Why seven comes up most", beat by beat, in Russian and English.
"""
from beats import Beat

TITLE = {"ru": "Почему семёрка выпадает чаще", "en": "Why seven comes up most"}

BEATS = [
    Beat("b01", ru="Два кубика бросили пять тысяч раз. Семёрка выпала чаще всех.", en="Two dice, thrown five thousand times. Seven came up most."),
    Beat("b02", ru="Кубики честные. Откуда у семёрки преимущество?", en="The dice are fair. So why does seven win?"),
    Beat("b03", ru="У одного кубика все грани равны. Шесть граней, шансы одинаковы.", en="On one die no face is favoured. Six faces, equal chances."),
    Beat("b04", ru="Теперь два кубика. Первый и второй.", en="Take two. A first and a second."),
    Beat("b05", ru="Каждой паре отведена своя клетка.", en="Give every pair its own cell."),
    Beat("b06", ru="Клеток тридцать шесть. Все выпадают одинаково часто.", en="Thirty-six cells. Each comes up equally often."),
    Beat("b07", ru="Сумма два. Одна клетка.", en="A sum of two. One cell."),
    Beat("b08", ru="Сумма три. Две клетки.", en="A sum of three. Two cells."),
    Beat("b09", ru="Четыре. Пять. Шесть.", en="Four. Five. Six."),
    Beat("b10", ru="Семь. Целая диагональ.", en="Seven. A whole diagonal."),
    Beat("b11", ru="Дальше клеток снова меньше.", en="After that, the cells run out again."),
    Beat("b12", ru="Диагонали встают рядом.", en="Lay the diagonals side by side."),
    Beat("b13", ru="Получилась горка. Та самая, из пяти тысяч бросков.", en="A hill. The same hill the throws made."),
    Beat("b14", ru="Вероятность есть просто доля клеток.", en="A probability is a share of cells."),
    Beat("b15", ru="У семёрки шесть клеток. У двойки одна.", en="Seven has six cells. Two has one."),
    Beat("b16", ru="А теперь три кубика. Клетки уже не помещаются на листе.", en="Now three dice. The cells no longer fit on a page."),
    Beat("b17", ru="Горка остаётся. Только становится глаже.", en="The hill stays. It only gets smoother."),
    Beat("b18", ru="Десять кубиков. Это уже колокол.", en="Ten dice. Now it is a bell."),
    Beat("b19", ru="Случай не выбирает семёрку. Её дают больше пар.", en="Chance does not prefer seven. More pairs give it."),
]
