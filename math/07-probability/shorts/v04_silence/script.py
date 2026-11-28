"""
The spoken text of the short "A minute of silence", beat by beat, in Russian and English.
"""
from beats import Beat

TITLE = {"ru": "Минута тишины", "en": "A minute of silence"}

BEATS = [
    Beat("b01", ru="В колл-центр звонят три раза в минуту.", en="A call centre gets three calls a minute."),
    Beat("b02", ru="Но бывают минуты полной тишины.", en="But some minutes are completely silent."),
    Beat("b03", ru="Как часто? Это можно сосчитать.", en="How often? It can be counted."),
    Beat("b04", ru="Минута разрезана на шесть кусков.", en="Cut the minute into six slices."),
    Beat("b05", ru="В куске звонок есть или нет.", en="A slice has a call or not."),
    Beat("b06", ru="Тишина значит шесть раз подряд нет.", en="Silence means no, six times running."),
    Beat("b07", ru="Куски мельче. Их шестьдесят.", en="Cut finer. Sixty slices."),
    Beat("b08", ru="Шестьсот.", en="Six hundred."),
    Beat("b09", ru="Шесть тысяч.", en="Six thousand."),
    Beat("b10", ru="Число перестало меняться.", en="The number has stopped changing."),
    Beat("b11", ru="Тишина бывает в одной минуте из двадцати.", en="One minute in twenty is silent."),
    Beat("b12", ru="Откуда берётся это число?", en="Where does this number come from?"),
    Beat("b13", ru="Теперь один звонок в минуту. Минута режется снова.", en="Take one call a minute. Cut again."),
    Beat("b14", ru="Получается единица, делённая на число e.", en="It comes to one over the number e."),
    Beat("b15", ru="Три звонка дают e в минус третьей.", en="Three calls give e to the minus three."),
    Beat("b16", ru="Так считают опечатки, аварии, распад атомов.", en="Misprints, accidents, decaying atoms count this way."),
    Beat("b17", ru="Число e появилось здесь само. Его никто не вводил.", en="The number e appears here by itself. Nobody put it in."),
]
