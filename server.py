"""Personal Travel Agent: deterministic local MCP server. pip install mcp"""
from mcp.server.fastmcp import FastMCP

mcp = FastMCP('Personal Travel Agent')

TRAVELERS = ['Just me', 'Two adults', 'Whole family', 'Other travelers']
OPTIONS = ['DEN Economy parking', 'Uber/Lyft XL', 'Central Park RTD + A Line']

@mcp.tool()
def start_trip(outbound_route: str, outbound_date: str, outbound_flight: str, outbound_departure: str, return_route: str, return_date: str, return_flight: str, return_arrival: str) -> dict:
    """Step 1: show airport-code itinerary and traveler choices only."""
    return {'step': 'choose_travelers', 'outbound': {'route': outbound_route, 'date': outbound_date, 'flight': outbound_flight, 'departure': outbound_departure}, 'return': {'route': return_route, 'date': return_date, 'flight': return_flight, 'arrival': return_arrival}, 'choices': TRAVELERS}

@mcp.tool()
def compare_transport(travelers: str) -> dict:
    """Step 2: fixed four-column comparison, without timing schedule."""
    if travelers not in TRAVELERS: raise ValueError('Choose a listed traveler option')
    family = travelers == 'Whole family'
    return {'step': 'choose_transport', 'travelers': travelers, 'columns': ['Option', 'Est. round-trip cost', 'Est. time', 'Convenience'], 'rows': [
        ['DEN Economy parking', '$100–$120', '50–75 min', 'Easiest with kids' if family else 'Drive yourself'],
        ['Uber/Lyft XL', '$120–$250+', '35–55 min', 'Install car seats' if family else 'Door-to-door'],
        ['Central Park RTD + A Line', '$48–$50', '60–90 min', 'More luggage handling']], 'est_time_basis': 'one way', 'prices_verified': False, 'choices': OPTIONS}

@mcp.tool()
def selected_transport(option: str, outbound_date: str, return_date: str, outbound_flight: str, return_flight: str, train_departure_outbound: str = '', train_arrival_outbound: str = '', train_departure_return: str = '', train_arrival_return: str = '', timetable_source: str = '', service_day_verified: bool = False) -> dict:
    """Step 3: prohibit guessed RTD times. Verified source required."""
    if option not in OPTIONS: raise ValueError('Choose a listed transport option')
    result = {'step': 'travel_schedule', 'option': option, 'outbound_date': outbound_date, 'return_date': return_date, 'outbound_flight': outbound_flight, 'return_flight': return_flight, 'simulation_only': True}
    if option == OPTIONS[2]:
        times = [train_departure_outbound, train_arrival_outbound, train_departure_return, train_arrival_return]
        if not (all(times) and timetable_source and service_day_verified):
            result.update(status='unverified', message='Exact RTD train times not verified; do not guess.', official_schedule='https://app.rtd-denver.com/route/A/schedule')
        else:
            result.update(status='published_timetable_verified', train_times=dict(zip(['central_park_departure', 'den_arrival', 'den_departure', 'central_park_arrival'], times)), source=timetable_source)
    else:
        result.update(status='timing_plan_required', message='Build schedule using verified flight times and parking/pickup buffers.')
    return result

if __name__ == '__main__':
    mcp.run(transport='streamable-http')
