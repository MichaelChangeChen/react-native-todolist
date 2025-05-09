import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { IconSymbol } from '@/components/ui/IconSymbol';
import 	Animated,
		{ 	useSharedValue,
			useAnimatedStyle,
			withTiming,
			runOnJS,
			Easing,
			interpolateColor } from 'react-native-reanimated';
import { 	useState,
			useEffect,
			useRef } from 'react';
import { 	Gesture,
			GestureDetector,
			GestureHandlerRootView } from 'react-native-gesture-handler';
import { 	View,
			Text,
			TextInput,
			FlatList,
			Button,
			StyleSheet,
			TouchableOpacity,
			Animated as Animat } from 'react-native';

type allList = {
	id: string,
	title: string,
	status: boolean
};

const TodoItem = ({	item,
					onChangeStatus,
					onDelete }:
	{
		item: allList,
		onChangeStatus(id: string): void,
		onDelete(id: string): void
	}) => {
	const 	bgcValue = useRef(new Animat.Value(item.status ? 1 : 0)).current,
			backgroundColor = bgcValue.interpolate({
				inputRange: [ 0, 1 ],
				outputRange: [ 'rgb(102, 255, 102)', '#ccc' ]
			});

	// GestureDetector
	const 	translateX = useSharedValue<number>(0),
			opacityDelete = useSharedValue<number>(0),
			opacityComplete = useSharedValue<number>(0);

	const 	animatedItemStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value > 200 ? 200 :
																			translateX.value < -200 ? -200 : translateX.value }] })),
			animatedDeleteStyle = useAnimatedStyle(() => ({ opacity: withTiming(opacityDelete.value, { duration: 100, easing: Easing.bezier(0.5, 0.01, 0, 1) }),
															backgroundColor: interpolateColor(
																opacityDelete.value,
																[0, 1], // 輸入範圍
																['rgba(255, 128, 128, 0)', 'rgba(255, 128, 128, 1)'] // 輸出顏色範圍
															) })),
			animatedCompleteStyle = useAnimatedStyle(() => ({ 	opacity: withTiming(opacityComplete.value, { duration: 100, easing: Easing.bezier(0.5, 0.01, 0, 1) }),
																backgroundColor: interpolateColor(
																	opacityComplete.value,
																	[0, 1], // 輸入範圍
																	['rgba(153, 255, 153, 0)', 'rgb(145, 255, 145)'] // 輸出顏色範圍
																) }));

	const panGesture = Gesture.Pan()
		.onUpdate(event => {
			translateX.value = event.translationX;

			if(translateX.value > 0) {
				opacityComplete.value = withTiming(Math.min(event.translationX / 200, 1), { duration: 0 });
				opacityDelete.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.5, 0.01, 0, 1) });
			}
			else {
				opacityDelete.value = withTiming(-Math.min(event.translationX / 200, 1), { duration: 0 });
				opacityComplete.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.5, 0.01, 0, 1) });
			};
		})
		.onEnd(event => {
			if(event.translationX > 200)
				runOnJS(onChangeStatus)(item.id);
			else if(event.translationX < -200)
				runOnJS(onDelete)(item.id);

			translateX.value = withTiming(0, { duration: 300 });
			opacityDelete.value = withTiming(0, { duration: 150 });
			opacityComplete.value = withTiming(0, { duration: 150 });
		});



	useEffect(() => {
		Animat.timing(bgcValue, {
			toValue: item.status ? 1 : 0,
			duration: 300,
			useNativeDriver: false
		}).start();
	}, [item.status]);

	return (
		<>
			<View style={styles.displayGroup}>
				<View style={styles.signGroup}>
					<Animated.View style={[styles.sign, animatedCompleteStyle]}>
						<IconSymbol
							name="checkmark"
							size={40}
							color="white" />
					</Animated.View>
					<Animated.View style={[styles.sign, animatedDeleteStyle]}>
						<IconSymbol
							style={styles.signEnd}
							name="trash.fill"
							size={40}
							color="white" />
					</Animated.View>
				</View>
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[animatedItemStyle]}>
						<Animat.View style={[styles.list, { backgroundColor }, animatedItemStyle]}>
							<Text style={styles.listText}>{item.title}</Text>
						</Animat.View>
					</Animated.View>
				</GestureDetector>
			</View>
		</>
	);
};

const TodoList = () => {
	const 	[ openInput, setOpenInput ] = useState<Boolean>(false),
			[ inputValue, setInputValue ] = useState<string>(''),
			[ listBox, setListBox ] = useState<allList[]>([
				{
					id: '001',
					title: '必做之事-1',
					status: false
				},
				{
					id: '002',
					title: '非必做之事',
					status: true
				}
			]);

	const renderItem = ({ item }: { item: allList }) => {
			return (
				<GestureHandlerRootView>
					<TodoItem
						item={item}
						onChangeStatus={changeStatus}
						onDelete={deleteTodoList} />
				</GestureHandlerRootView>
			);
		},
		addPress = () => setOpenInput(true),
		cancelTodoList = () => {
			setOpenInput(false);
			setInputValue('');
		},
		submitTodoList = () => {
			setListBox([
				{
					id: uuidv4(),
					title: inputValue,
					status: false
				},
				...listBox
			]);
			cancelTodoList();
		},
		deleteTodoList = (id: string) => setListBox(listBox.filter(e => e.id !== id)),
		changeStatus = (id: string) => setListBox(listBox.map(e => e.id === id ? { ...e, status: !e.status } : e));

	return (
		<>
			<View style={styles.view}>
				<Text style={styles.title}>TODO LIST</Text>
				<View style={styles.listView}>
					<Button
						title="Add Todo List"
						disabled={!!openInput}
						onPress={addPress} />
						{ openInput && <>
							<TextInput
								value={inputValue}
								onChangeText={text => setInputValue(text)}
								style={styles.inputs} />
							<View style={styles.btnGroup}>
								<TouchableOpacity
									onPress={submitTodoList}
									disabled={!inputValue}
									style={[styles.btn, !inputValue ? styles.btnDisabled : '']}>
									<Text style={styles.btnText}>Submit</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={cancelTodoList}
									style={[styles.btn, styles.btnCancel]}>
									<Text style={styles.btnText}>Cancel</Text>
								</TouchableOpacity>
							</View>
						</> }
					<View style={styles.descriptGroup}>
						<View style={styles.descriptBox}>
							<View style={[styles.descriptColor, styles.imcompleteColor]} />
							<Text style={styles.imcompleteText}>: Imcomplete</Text>
						</View>
						<View style={styles.descriptBox}>
							<Text style={styles.imcompleteText}>Imcomplete Item : { listBox.filter(e => e.status === false).length }</Text>
						</View>
					</View>
					<View style={styles.descriptGroup}>
						<View style={styles.descriptBox}>
							<View style={[styles.descriptColor, styles.completeColor]} />
							<Text style={styles.imcompleteText}>: Complete</Text>
						</View>
						<View style={styles.descriptBox}>
							<Text style={styles.imcompleteText}>Total Item : { listBox.length }</Text>
						</View>
					</View>
					<FlatList
						data={listBox}
						renderItem={renderItem}
						keyExtractor={(item) => item.id}
						style={styles.mainList} />
				</View>
			</View>
		</>
	)
};

const styles = StyleSheet.create({
	view: {
		paddingTop: 50,
		paddingBottom: 20,
		paddingHorizontal: 10,
		backgroundColor: '#f5f5f5',
	},
	title: {
		textAlign: 'center',
		fontSize: 25,
		fontWeight: 'bold',
		color: '#333',
	},
	listView: {
		paddingTop: 20,
		paddingBottom: 80,
		height: '100%'
	},
	list: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 15,
		borderRadius: 8,
		elevation: 2,
		zIndex: 1,
	},
	listText: {
		flex: 1,
		textAlign: 'center',
		fontWeight: 'bold',
		fontSize: 18,
		color: 'rgb(120, 120, 120)',
		letterSpacing: 2
	},
	inputs: {
		borderWidth: 1,
		borderColor: '#ccc',
		margin: 10,
		padding: 10,
		borderRadius: 8,
		backgroundColor: '#fff',
	},
	btnGroup: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 20,
	},
	btn: {
		backgroundColor: '#587eff',
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	btnCancel: {
		backgroundColor: '#ffa348',
	},
	btnDisabled: {
		backgroundColor: '#ccc',
	},
	btnText: {
		textAlign: 'center',
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
	mainList: {
		marginTop: 15,
	},
	descriptGroup: {
		paddingHorizontal: 5,
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	descriptBox: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	descriptColor: {
		width: 18,
		height: 18,
		marginRight: 5,
	},
	imcompleteColor: {
		backgroundColor: 'rgba(153, 255, 153, 1)'
	},
	completeColor: {
		backgroundColor: '#ccc'
	},
	imcompleteText: {
		color: 'rgb(163, 163, 163)',
		fontWeight: 'bold',
	},
	displayGroup: {
		position: 'relative',
		marginBottom: 10
	},
	signGroup: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		bottom: 0,
		paddingHorizontal: 10,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	sign: {
		alignSelf: 'center',
		width: '50%',
		borderRadius: 8,
		paddingHorizontal: 10,
		height: '80%',
		flexDirection: 'column',
		justifyContent: 'center'
	},
	signEnd: {
		textAlign: 'right'
	}
});

export default TodoList;